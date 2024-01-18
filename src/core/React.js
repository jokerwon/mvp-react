function createTextNode(text) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: [],
    },
  }
}

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) => (['string', 'number', 'boolean'].includes(typeof child) ? createTextNode(child) : child)),
    },
  }
}

function createDOM(type) {
  return type === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(type)
}

// ReactDOM 中会调用
function render(el, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [el],
    },
  }
  nextWorkOfUnit = wipRoot
}

function update() {
  wipRoot = {
    dom: currentRoot.dom,
    props: currentRoot.props,
    alternate: currentRoot,
  }
  nextWorkOfUnit = wipRoot
}

let wipRoot = null
let currentRoot = null
let nextWorkOfUnit = null
function workLoop(deadline) {
  let shouldYield = false
  while (!shouldYield && nextWorkOfUnit) {
    nextWorkOfUnit = performWorkOfUnit(nextWorkOfUnit)
    shouldYield = deadline.timeRemaining() < 1

    if (!nextWorkOfUnit && wipRoot) {
      commitRoot()
    }
  }

  requestIdleCallback(workLoop)
}

function commitRoot() {
  commitWork(wipRoot.child)
  currentRoot = wipRoot
  wipRoot = null
}

function commitWork(fiber) {
  if (!fiber) return

  let parent = fiber.parent
  while (!parent.dom) {
    parent = parent.parent
  }

  if (fiber.effectTag === 'update') {
    updateProps(fiber.dom, fiber.props, fiber.alternate?.props)
  } else if (fiber.effectTag === 'placement' && fiber.dom) {
    parent.dom.append(fiber.dom)
  }

  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

function updateProps(dom, nextProps = {}, prevProps = {}) {
  // 删除属性（老的有，新的没有）
  Object.keys(prevProps).forEach((propKey) => {
    if (propKey !== 'children' && !(propKey in nextProps)) {
      // 解绑事件
      if (propKey.startsWith('on')) {
        const eventType = propKey.toLowerCase().substring(2)
        dom.removeEventListener(eventType, prevProps[propKey])
        return
      }
      dom[propKey] = ''
    }
  })

  // 更新属性，包括新增（老的没有，新的有）和修改（老的和新的都有）
  Object.keys(nextProps).forEach((propKey) => {
    if (propKey !== 'children' && nextProps[propKey] !== prevProps[propKey]) {
      // 绑定事件
      if (propKey.startsWith('on')) {
        const eventType = propKey.toLowerCase().substring(2)
        dom.removeEventListener(eventType, prevProps[propKey])
        dom.addEventListener(eventType, nextProps[propKey])
        return
      }
      dom[propKey] = nextProps[propKey]
    }
  })
}

function reconcileChildren(fiber, children) {
  let oldFiber = fiber.alternate?.child
  console.log('oldFiber', oldFiber)
  let prevChild = null
  children.forEach((child, index) => {
    const isSameType = oldFiber && child.type === oldFiber?.type
    let newFiber = null
    if (isSameType) {
      // update
      newFiber = {
        type: child.type,
        props: child.props,
        parent: fiber,
        child: null,
        sibling: null,
        dom: oldFiber.dom,
        alternate: oldFiber,
        effectTag: 'update',
      }
    } else {
      newFiber = {
        type: child.type,
        props: child.props,
        parent: fiber,
        child: null,
        sibling: null,
        dom: null,
        effectTag: 'placement',
      }
    }

    if (oldFiber) {
      // 子节点不止一个，oldFiber 指针移动到兄弟节点
      oldFiber = oldFiber.sibling
    }

    if (index === 0) {
      fiber.child = newFiber
    } else {
      prevChild.sibling = newFiber
    }

    prevChild = newFiber
  })
}

function updateFunctionComponent(fiber) {
  const children = [fiber.type(fiber.props)]
  reconcileChildren(fiber, children)
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    const dom = (fiber.dom = createDOM(fiber.type))
    // 后置到 fiber 处理完后统一挂载
    // fiber.parent.dom.append(dom)
    updateProps(dom, fiber.props)
  }
  const children = fiber.props.children
  reconcileChildren(fiber, children)
}

function performWorkOfUnit(fiber) {
  const isFunctionComponent = typeof fiber.type === 'function'
  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }
  // 返回下一个要执行的任务
  if (fiber.child) {
    return fiber.child
  }

  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
  return null
}

requestIdleCallback(workLoop)

const React = {
  update,
  render,
  createElement,
}

export default React

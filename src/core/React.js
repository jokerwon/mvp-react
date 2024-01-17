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
  nextWorkOfUnit = {
    dom: container,
    props: {
      children: [el],
    },
  }
  root = nextWorkOfUnit
}

let root = null
let nextWorkOfUnit = null
function workLoop(deadline) {
  let shouldYield = false
  while (!shouldYield && nextWorkOfUnit) {
    nextWorkOfUnit = performWorkOfUnit(nextWorkOfUnit)
    shouldYield = deadline.timeRemaining() < 1

    if (!nextWorkOfUnit && root) {
      commitRoot()
      root = null
    }
  }

  requestIdleCallback(workLoop)
}

function commitRoot() {
  commitWork(root.child)
}

function commitWork(fiber) {
  if (!fiber) return

  if (fiber.dom) {
    let parent = fiber.parent
    while (!parent.dom) {
      parent = parent.parent
    }
    parent.dom.append(fiber.dom)
  }

  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

function updateProps(dom, props) {
  Object.keys(props).forEach((propKey) => {
    if (propKey !== 'children') {
      // 绑定事件
      if (propKey.startsWith('on')) {
        const eventType = propKey.toLowerCase().substring(2)
        dom.addEventListener(eventType, props[propKey])
        return
      }
      dom[propKey] = props[propKey]
    }
  })
}

function initChidren(fiber, children) {
  let prevChild = null
  children.forEach((child, index) => {
    const newFiber = {
      type: child.type,
      props: child.props,
      parent: null,
      child: null,
      sibling: null,
      dom: null,
    }
    newFiber.parent = fiber
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
  initChidren(fiber, children)
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    const dom = (fiber.dom = createDOM(fiber.type))
    // 后置到 fiber 处理完后统一挂载
    // fiber.parent.dom.append(dom)
    updateProps(dom, fiber.props)
  }
  const children = fiber.props.children
  initChidren(fiber, children)
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

  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
  return null;
}

requestIdleCallback(workLoop)

const React = {
  render,
  createElement,
}

export default React

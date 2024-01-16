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
      children: children.map((child) => (typeof child === 'string' ? createTextNode(child) : child)),
    },
  }
}

function createDOM(type) {
  return type === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(type)
}

// ReactDOM 中会调用
function render(el, container) {
  const fiber = {
    dom: container,
    props: {
      children: [el],
    },
  }
  nextWorkOfUnit = fiber
}

let nextWorkOfUnit = null
function workLoop(deadline) {
  let shouldYield = false
  while (!shouldYield && nextWorkOfUnit) {
    nextWorkOfUnit = performWorkOfUnit(nextWorkOfUnit)
    shouldYield = deadline.timeRemaining() < 1
  }

  requestIdleCallback(workLoop)
}

function updateProps(dom, props) {
  Object.keys(props).forEach((propKey) => {
    if (propKey !== 'children') {
      dom[propKey] = props[propKey]
    }
  })
}

function initChidren(fiber) {
  let prevChild = null
  fiber.props.children.forEach((child, index) => {
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

function performWorkOfUnit(fiber) {
  if (!fiber.dom) {
    const dom = (fiber.dom = createDOM(fiber.type))
    fiber.parent.dom.append(dom)
    updateProps(dom, fiber.props)
  }
  initChidren(fiber)

  // 4. 返回下一个要执行的任务
  if (fiber.child) {
    return fiber.child
  }
  if (fiber.sibling) {
    return fiber.sibling
  }
  // 返回叔叔节点
  return fiber.parent?.sibling
}

requestIdleCallback(workLoop)

const React = {
  render,
  createElement,
}

export default React

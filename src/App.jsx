import React from './core/React.js'

function Counter(props) {
  return <div>counter: {props.number}</div>
}

function Wrap() {
  return <Counter number={10} />
}

function App() {
  return (
    <div>
      Hello React
      <Counter number={10} />
      <Counter number={100} />
    </div>
  )
}

export default App

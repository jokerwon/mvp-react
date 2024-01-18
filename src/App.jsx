import React from './core/React.js'

function Counter(props) {
  return <div>counter: {props.number}</div>
}

let count = 10

function App() {
  return (
    <div>
      {/* <Counter number={count} /> */}
      count: {count}
      <button
        onClick={() => {
          console.log('clicked')
          count += 1
          React.update()
        }}
      >
        Click
      </button>
    </div>
  )
}

export default App

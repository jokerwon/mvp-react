import { describe, test, expect } from 'vitest'
import React from '../React'

describe('React', () => {
  test('should return vdom', () => {
    expect(React.createElement('div', { id: 'app' }, 'Hello')).toEqual({
      type: 'div',
      props: {
        id: 'app',
        children: [
          {
            type: 'TEXT_ELEMENT',
            props: {
              nodeValue: 'Hello',
              children: [],
            }
          }
        ],
      },
    })
  })
})

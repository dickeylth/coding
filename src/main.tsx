import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

const App = () => {
  return (
    <ul>
      <li><a href='/mvp/'>Online Bundler MVP</a></li>
      <li><a href='/ide/'>Online IDE</a></li>
    </ul>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
)

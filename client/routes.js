import React from 'react'
import { BrowserRouter as Router, Route, Link } from 'react-router-dom'
import { Home } from './containers/index'

export default store => {
  return (
    <Router>
      <Route path="/" component={ Home } />
    </Router>
  )
}
import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import decodeJWT from 'jwt-decode'
import axios from 'axios'
import { BrowserRouter, Route, Link, Redirect } from 'react-router-dom'
import { api, setJwt } from './api/init'
import Bookmark from './components/Bookmark'
import SignIn from './components/SignIn'
// import LogoutBtn from './components/LogoutBtn'
// import CreateBookmark from './components/CreateBookmark'

class App extends Component {
  state = {
    bookmarks: [],
    token: null,
    loginError: null,
    logoutError: null,
    loggedIn: false
  }

  handleSignIn = async (event) => {
    try {
      event.preventDefault()
      const form = event.target
      const response = await api.post('/auth/login', {
        email: form.elements.email.value,
        password: form.elements.password.value
      })
      let bookmarks = await this.fetchBookmarks()
      this.setState({
        token: response.data.token,
        bookmarks: bookmarks.data,
        loggedIn: true
      })
      setJwt(response.data.token)
      localStorage.setItem('token', this.state.token);
    } catch (error) {
      this.setState({ loginError: error.message })
    }
  }

  fetchBookmarks = async () => {
    const bookmarks = await axios.get(
      'http://localhost:3000/bookmarks'
    )
    return bookmarks
  }

  remove = (id) => { // id = Mongo _id of the bookmark
      const index = this.state.bookmarks.findIndex(bookmark => bookmark._id === id)
      if (index >= 0) {
        const bookmarks = [...this.state.bookmarks]
        bookmarks.splice(index, 1)
        this.setState({ bookmarks })
      }
  }

  logout = async () => {
    try {
      const response = await api.get('/auth/logout')
      this.setState({
        token: '',
        loggedIn: false
      })
      localStorage.removeItem('token')
    } catch (error) {
      this.setState({ logoutError: error.message })
    }
  }

  createEntry = async (event) => {
    const form = event.target
    const response = await api.post('/bookmarks', {
      title: form.elements.title.value,
      url: form.elements.url.value
    })
    let bookmarks = await this.fetchBookmarks()
    this.setState({bookmarks})
  }

  render() {
    const tokenDetails = this.state.token && decodeJWT(this.state.token)
    const { bookmarks, token, loggedIn } = this.state
    return (
      <BrowserRouter>
        <div className="App">
          <Route path='/login' render={() => {
            return (token && loggedIn ? (
                <React.Fragment>
                  <h4>Welcome { tokenDetails.email }!</h4>
                  <p>You logged in at: { new Date(tokenDetails.iat * 1000).toLocaleString() }</p>
                  <p>Your token expires at: { new Date(tokenDetails.exp * 1000).toLocaleString() }</p>
                  {/* <LogoutBtn logout={this.logout}/> */}
                </React.Fragment>
              ) : (
                <SignIn loginError={this.state.loginError} handleSignIn={this.handleSignIn} />
              ))
          }} />
          <Route exact path='/bookmarks' render={() => {
            return (
              <div>  
                <h1>Bookmarks</h1>
                <ul>
                {
                  bookmarks.map(
                    bookmark => <Bookmark key={bookmark._id} {...bookmark} remove={this.remove} />
                  )
                }
                </ul>
              </div>
            )
          }} />
          {/* <Route path='bookmarks/new' createEntry={this.createEntry} component={CreateBookmark} /> */}
        </div>
      </BrowserRouter>
    );
  }

  async componentDidMount() {
      let token = localStorage.getItem('token')
      if (this.state.bookmarks.length < 1){
        let bookmarks = await this.fetchBookmarks()
        console.log(bookmarks)
        this.setState({
          bookmarks: bookmarks.data
        })
      }  
      token && this.setState({
        token: token,
        loggedIn: true,
      })
  }
}

export default App;

import {
  LOGIN,
  LOGIN_OUT,
  LOGIN_TYPE,
  GET_LOGIN_STATE
} from '../constants/action-types.js';
import axios from 'axios';

const checkLoginState = () => {
  return {
    type: GET_LOGIN_STATE,
    // payload 可以返回 Promise，异步请求使用 axios 即可
    payload: axios.get('/user/status')
  };
}

const loginActions = (data) => {
  return (dispatch) => {
    axios.post('/user/login', data).then((res) => {
      if (res.data.errcode === 0) {
        dispatch({
          type: LOGIN,
          payload: {
            data: res
          }
        });
      } else {
        console.log('登录失败,errcode不为0');
      }
    }).catch((err) => {
      console.log(err);
    });
  }
}

const regActions = (data) => {
  console.log(data);
  const param = {
    email: data.email,
    password: data.password,
    username: data.userName
  }
  return () => {
    axios.post('/user/login', param).then((res) => {
      console.log(res);
    }).catch((err) => {
      console.log(err);
    });
  }
}

const logoutActions = () => {
  return(dispatch)=>{
    axios.get('./user/logout').then((res) => {
      console.log(res);
      if(res.data.errcode === 0){
        dispatch({
          type: LOGIN_OUT
        })
      }
    }).catch((err) => {
      console.log(err);
    })
  }
}

const loginTypeAction = (index) => {
  return{
    type: LOGIN_TYPE,
    index
  }
}

export default {
  loginActions,
  regActions,
  logoutActions,
  loginTypeAction,
  checkLoginState
}

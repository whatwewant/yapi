import './Interface.scss'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import axios from 'axios'
import InterfaceList from './InterfaceList/InterfaceList.js'
import InterfaceTable from './InterfaceTable/InterfaceTable.js'
import InterfaceMode from './InterfaceMode/InterfaceMode.js'
import moment from 'moment'
import {
  fetchInterfaceData, 
  projectMember,
  closeProjectMember
} from '../../actions/interfaceAction.js'

@connect(
  state => {
    return {
      interfaceData: state.Interface.interfaceData,
      modalVisible: state.Interface.modalVisible,
      closeProjectMember: state.Interface.closeProjectMember
    }
  },
  {
    fetchInterfaceData,
    projectMember,
    closeProjectMember
  }
)

class Interface extends Component {
  static propTypes = {
    fetchInterfaceData: PropTypes.func,
    interfaceData: PropTypes.array,
    projectMember: PropTypes.func,
    closeProjectMember: PropTypes.func,
    modalVisible: PropTypes.bool
  }

  constructor(props) {
    super(props)
  }

  componentWillMount () {
    // 558 665 704 743
    const params = {
      params: {
        project_id: 558
      }
    }

    axios.get('/interface/list', params)
      .then(result => {
        result = result.data.data
        result.map(value => {
          value.add_time = moment(value.add_time).format('YYYY-MM-DD HH:mm:ss')
          return value
        })
        this.props.fetchInterfaceData(result)
      })
      .catch(e => {
        console.log(e)
      })
  }

  render () {
    const { interfaceData, projectMember, modalVisible } = this.props
    return (
      <div>
        <section className="interface-box">
          <InterfaceList projectMember={projectMember} />
          <InterfaceMode modalVisible={modalVisible} closeProjectMember={this.props.closeProjectMember} />
          <InterfaceTable data={interfaceData} />
        </section>
      </div>
    )
  }
}

export default Interface

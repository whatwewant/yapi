import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Button, Icon, Modal, Input, message, Menu, Row, Col } from 'antd'
import { autobind } from 'core-decorators';
import axios from 'axios';

const Search = Input.Search;
const TYPE_EDIT = 'edit';

import {
  fetchGroupList,
  setCurrGroup,
  addGroup,
  fetchProjectList
} from '../../../actions/group.js'

import './GroupList.scss'

@connect(
  state => ({
    groupList: state.group.groupList,
    currGroup: state.group.currGroup
  }),
  {
    fetchGroupList,
    setCurrGroup,
    addGroup,
    fetchProjectList
  }
)
export default class GroupList extends Component {

  static propTypes = {
    groupList: PropTypes.array,
    currGroup: PropTypes.object,
    fetchGroupList: PropTypes.func,
    setCurrGroup: PropTypes.func,
    fetchProjectList: PropTypes.func
  }

  state = {
    addGroupModalVisible: false,
    editGroupModalVisible: false,
    newGroupName: '',
    newGroupDesc: ''
  }

  constructor(props) {
    super(props)
  }

  componentWillMount() {
    this.props.fetchGroupList().then(() => {
      const currGroup = this.props.groupList[0] || { group_name: '', group_desc: '' };
      this.props.setCurrGroup(currGroup)
    });
  }

  @autobind
  showModal(type) {
    if (type === 'edit') {
      const { currGroup } = this.props;
      this.setState({
        currGroupName: currGroup.group_name,
        currGroupDesc: currGroup.group_desc,
        editGroupModalVisible: true
      });
    } else {
      this.setState({
        addGroupModalVisible: true
      });
    }
  }
  @autobind
  hideModal(type) {
    if (type === TYPE_EDIT) {
      this.setState({
        editGroupModalVisible: false
      });
    } else {
      this.setState({
        addGroupModalVisible: false
      });
    }
  }
  @autobind
  addGroup() {
    const { newGroupName: group_name, newGroupDesc: group_desc } = this.state;
    axios.post('/group/add', { group_name, group_desc }).then(res => {
      if (res.data.errcode) {
        message.error(res.data.errmsg);
      } else {
        this.setState({
          addGroupModalVisible: false
        });
        this.props.fetchGroupList()
      }
    });
  }
  @autobind
  editGroup() {
    const { currGroupName: group_name, currGroupDesc: group_desc } = this.state;
    const id = this.props.currGroup._id;
    axios.post('/group/up', { group_name, group_desc, id }).then(res => {
      if (res.data.errcode) {
        message.error(res.data.errmsg);
      } else {
        this.setState({
          editGroupModalVisible: false
        });
        this.props.setCurrGroup({ group_name, group_desc, _id: id });
      }
    });
  }
  @autobind
  inputNewGroupName(e, type) {
    if (type === TYPE_EDIT) {
      this.setState({ currGroupName: e.target.value})
    } else {
      this.setState({newGroupName: e.target.value});
    }
  }
  @autobind
  inputNewGroupDesc(e, type) {
    if (type === TYPE_EDIT) {
      this.setState({ currGroupDesc: e.target.value})
    } else {
      this.setState({newGroupDesc: e.target.value});
    }
  }

  @autobind
  selectGroup(e) {
    const groupId = e.key;
    const currGroup = this.props.groupList.find((group) => { return +group._id === +groupId });
    this.props.setCurrGroup(currGroup);
  }

  render () {
    const { groupList, currGroup } = this.props;

    return (
      <div>
        <div className="group-bar">
          <div className="curr-group">
            <div className="curr-group-name">
              {currGroup.group_name}
              <Icon className="edit-group" type="edit" onClick={() => this.showModal(TYPE_EDIT)}/>
            </div>
            <div className="curr-group-desc">简介：{currGroup.group_desc}</div>
          </div>
          <div className="group-operate">
            <div className="search">
              <Search
                placeholder="input search text"
                onSearch={value => console.log(value)}
              />
            </div>
            <Button type="primary" onClick={this.showModal}>添加分组</Button>
          </div>
          <Menu
            className="group-list"
            mode="inline"
            onClick={this.selectGroup}
            selectedKeys={[`${currGroup._id}`]}
          >
            {
              groupList.map((group) => (
                <Menu.Item key={`${group._id}`} className="group-item">
                  <Icon type="folder-open" />{group.group_name}
                </Menu.Item>
              ))
            }
          </Menu>
        </div>
        <Modal
          title="添加分组"
          visible={this.state.addGroupModalVisible}
          onOk={this.addGroup}
          onCancel={this.hideModal}
          className="add-group-modal"
        >
          <Row gutter={6} className="modal-input">
            <Col span="5"><div className="label">分组名：</div></Col>
            <Col span="15">
              <Input placeholder="请输入分组名称" onChange={this.inputNewGroupName}></Input>
            </Col>
          </Row>
          <Row gutter={6} className="modal-input">
            <Col span="5"><div className="label">简介：</div></Col>
            <Col span="15">
              <Input placeholder="请输入分组描述" onChange={this.inputNewGroupDesc}></Input>
            </Col>
          </Row>
        </Modal>
        <Modal
          title="编辑分组"
          visible={this.state.editGroupModalVisible}
          onOk={this.editGroup}
          onCancel={() => this.hideModal(TYPE_EDIT)}
          className="add-group-modal"
        >
          <Row gutter={6} className="modal-input">
            <Col span="5"><div className="label">分组名：</div></Col>
            <Col span="15">
              <Input placeholder="请输入分组名称" value={this.state.currGroupName} onChange={(e) => this.inputNewGroupName(e, TYPE_EDIT)}></Input>
            </Col>
          </Row>
          <Row gutter={6} className="modal-input">
            <Col span="5"><div className="label">简介：</div></Col>
            <Col span="15">
              <Input placeholder="请输入分组描述" value={this.state.currGroupDesc} onChange={(e) => this.inputNewGroupDesc(e, TYPE_EDIT)}></Input>
            </Col>
          </Row>
        </Modal>
      </div>
    )
  }
}

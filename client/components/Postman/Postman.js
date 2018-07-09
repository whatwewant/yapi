import React, { PureComponent as Component } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Input,
  Checkbox,
  Modal,
  Select,
  Spin,
  Icon,
  Collapse,
  Tooltip,
  Tabs,
  Switch,
  Row,
  Col
} from 'antd';
import constants from '../../constants/variable.js';
import AceEditor from 'client/components/AceEditor/AceEditor';
import _ from 'underscore';
import { isJson, deepCopyJson } from '../../common.js';
import axios from 'axios';
import ModalPostman from '../ModalPostman/index.js';
import CheckCrossInstall, { initCrossRequest } from './CheckCrossInstall.js';
import './Postman.scss';
import ProjectEnv from '../../containers/Project/Setting/ProjectEnv/index.js';
import json5 from 'json5';
const { handleParamsValue } = require('common/utils.js');
const {
  handleParams,
  checkRequestBodyIsRaw,
  handleContentType,
  crossRequest,
  checkNameIsExistInArray
} = require('common/postmanLib.js');

const HTTP_METHOD = constants.HTTP_METHOD;
const InputGroup = Input.Group;
const Option = Select.Option;
const Panel = Collapse.Panel;

const InsertCodeMap = [
  {
    code: 'assert.equal(status, 200)',
    title: '断言 httpCode 等于 200'
  },
  {
    code: 'assert.equal(body.errcode, 0)',
    title: '断言返回数据 errcode 是 0'
  },
  {
    code: 'assert.notEqual(status, 404)',
    title: '断言 httpCode 不是 404'
  },
  {
    code: 'assert.notEqual(body.errcode, 40000)',
    title: '断言返回数据 errcode 不是 40000'
  },
  {
    code: 'assert.deepEqual(body, {"errcode": 0})',
    title: '断言对象 body 等于 {"errcode": 0}'
  },
  {
    code: 'assert.notDeepEqual(body, {"errcode": 0})',
    title: '断言对象 body 不等于 {"errcode": 0}'
  }
];

const TooltipContent = props => {
  const { example, desc } = props;
  const isNull = !example && !desc;
  
  return (
    <div>
      {example && <div>示例： {example}</div>}
      {desc && <div>备注： {desc}</div>}
      {isNull && <div>没有备注和示例信息</div>}
    </div>
  );
};
TooltipContent.propTypes = {
  example: PropTypes.string,
  desc: PropTypes.string
};

export default class Run extends Component {
  static propTypes = {
    data: PropTypes.object, //接口原有数据
    save: PropTypes.func, //保存回调方法
    type: PropTypes.string //enum[case, inter], 判断是在接口页面使用还是在测试集
  };

  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      resStatusCode: null,
      resStatusText: null,
      case_env: '',
      mock_verify: false,
      enable_script: false,
      test_script: '',
      hasPlugin: true,
      inputValue: '',
      cursurPosition: { row: 1, column: -1 },
      envModalVisible: false,
      test_res_header: null,
      test_res_body: null,
      ...this.props.data
    };
  }

  checkInterfaceData(data) {
    if (!data || typeof data !== 'object' || !data._id) {
      return false;
    }
    return true;
  }

  // 整合header信息
  handleReqHeader = (value, env) => {
    let index = value
      ? env.findIndex(item => {
          return item.name === value;
        })
      : 0;
    index = index === -1 ? 0 : index;

    let req_header = [].concat(this.props.data.req_headers || []);
    let header = [].concat(env[index].header || []);
    header.forEach(item => {
      if (!checkNameIsExistInArray(item.name, req_header)) {
        item = {
          ...item,
          abled: true
        };
        req_header.push(item);
      }
    });
    req_header = req_header.filter(item => {
      return item && typeof item === 'object';
    });
    return req_header;
  };

  selectDomain = value => {
    let headers = this.handleReqHeader(value, this.state.env);
    this.setState({
      case_env: value,
      req_headers: headers
    });
  };

  async initState(data) {
    if (!this.checkInterfaceData(data)) {
      return null;
    }

    const { req_body_other, req_body_type, req_body_is_json_schema } = data;
    let body = req_body_other;
    // 运行时才会进行转换
    if (
      this.props.type === 'inter' &&
      req_body_type === 'json' &&
      req_body_other &&
      req_body_is_json_schema
    ) {
      let schema = {};
      try {
        schema = json5.parse(req_body_other);
      } catch (e) {
        console.log('e', e);
        return;
      }
      let result = await axios.post('/api/interface/schema2json', {
        schema: schema,
        required: true
      });
      body = JSON.stringify(result.data);
      
    }

    this.setState(
      {
        ...this.state,
        test_res_header: null,
        test_res_body: null,
        ...data,
        req_body_other: body,
        resStatusCode: null,
        resStatusText: null
      },
      () => this.props.type === 'inter' && this.initEnvState(data.case_env, data.env)
    );
  }

  initEnvState(case_env, env) {
    let headers = this.handleReqHeader(case_env, env);

    this.setState(
      {
        req_headers: headers,
        env: env
      },
      () => {
        let s = !_.find(env, item => item.name === this.state.case_env);
        if (!this.state.case_env || s) {
          this.setState({
            case_env: this.state.env[0].name
          });
        }
      }
    );
  }

  componentWillMount() {
    this._crossRequestInterval = initCrossRequest(hasPlugin => {
      this.setState({
        hasPlugin: hasPlugin
      });
    });
    this.initState(this.props.data);
  }

  componentWillUnmount() {
    clearInterval(this._crossRequestInterval);
  }

  componentWillReceiveProps(nextProps) {
    if (this.checkInterfaceData(nextProps.data) && this.checkInterfaceData(this.props.data)) {
      if (nextProps.data._id !== this.props.data._id) {
        this.initState(nextProps.data);
      } else if (nextProps.data.interface_up_time !== this.props.data.interface_up_time) {
        this.initState(nextProps.data);
      }
      if (nextProps.data.env !== this.props.data.env) {
        this.initEnvState(this.state.case_env, nextProps.data.env);
      }
    }
  }

  handleValue(val) {
    return handleParamsValue(val, {});
  }

  onOpenTest = d => {
    this.setState({
      test_script: d.text
    });
  };

  handleInsertCode = code => {
    this.aceEditor.editor.insertCode(code);
  };

  handleRequestBody = d => {
    this.setState({
      req_body_other: d.text
    });
  };

  reqRealInterface = async () => {
    if (this.state.loading === true) {
      this.setState({
        loading: false
      });
      return null;
    }
    this.setState({
      loading: true
    });
    let options = handleParams(this.state, this.handleValue),
      result;

    try {
      result = await crossRequest(options, this.state.pre_script, this.state.after_script);
      result = {
        header: result.res.header,
        body: result.res.body,
        status: result.res.status,
        statusText: result.res.statusText,
        runTime: result.runTime
      };
    } catch (data) {
      result = {
        header: data.header,
        body: data.body,
        status: null,
        statusText: data.message
      };
    }
    if (this.state.loading === true) {
      this.setState({
        loading: false
      });
    } else {
      return null;
    }

    let tempJson = result.body;
    if (tempJson && typeof tempJson === 'object') {
      result.body = JSON.stringify(tempJson, null, '  ');
      this.setState({
        res_body_type: 'json'
      });
    } else if (isJson(result.body)) {
      this.setState({
        res_body_type: 'json'
      });
    }
    this.setState({
      resStatusCode: result.status,
      resStatusText: result.statusText,
      test_res_header: result.header,
      test_res_body: result.body
    });
  };

  changeParam = (name, v, index, key) => {
    key = key || 'value';
    const pathParam = deepCopyJson(this.state[name]);

    pathParam[index][key] = v;
    this.setState({
      [name]: pathParam
    });
  };

  changeBody = (v, index, key) => {
    const bodyForm = deepCopyJson(this.state.req_body_form);
    key = key || 'value';
    if (key === 'value') {
      bodyForm[index].enable = true;
      if (bodyForm[index].type === 'file') {
        bodyForm[index].value = 'file_' + index;
      } else {
        bodyForm[index].value = v;
      }
    } else if (key === 'enable') {
      bodyForm[index].enable = v;
    }
    this.setState({ req_body_form: bodyForm });
  };

  // 模态框的相关操作
  showModal = (val, index, type) => {
    let inputValue = '';
    let cursurPosition;
    if (type === 'req_body_other') {
      // req_body
      let editor = this.aceEditor.editor.editor;
      cursurPosition = editor.session.doc.positionToIndex(editor.selection.getCursor());
      // 获取选中的数据
      inputValue = this.getInstallValue(val || '', cursurPosition).val;
    } else {
      // 其他input 输入
      let oTxt1 = document.getElementById(`${type}_${index}`);
      cursurPosition = oTxt1.selectionStart;
      inputValue = this.getInstallValue(val || '', cursurPosition).val;
      // cursurPosition = {row: 1, column: position}
    }

    this.setState({
      modalVisible: true,
      inputIndex: index,
      inputValue,
      cursurPosition,
      modalType: type
    });
  };

  // 点击插入
  handleModalOk = val => {
    const { inputIndex, modalType } = this.state;
    if (modalType === 'req_body_other') {
      this.changeInstallBody(modalType, val);
    } else {
      this.changeInstallParam(modalType, val, inputIndex);
    }

    this.setState({ modalVisible: false });
  };

  // 根据鼠标位置往req_body中动态插入数据
  changeInstallBody = (type, value) => {
    const pathParam = deepCopyJson(this.state[type]);
    // console.log(pathParam)
    let oldValue = pathParam || '';
    let newValue = this.getInstallValue(oldValue, this.state.cursurPosition);
    let left = newValue.left;
    let right = newValue.right;
    this.setState({
      [type]: `${left}${value}${right}`
    });
  };

  // 获取截取的字符串
  getInstallValue = (oldValue, cursurPosition) => {
    let left = oldValue.substr(0, cursurPosition);
    let right = oldValue.substr(cursurPosition);

    let leftPostion = left.lastIndexOf('{{');
    let leftPostion2 = left.lastIndexOf('}}');
    let rightPostion = right.indexOf('}}');
    // console.log(leftPostion, leftPostion2,rightPostion, rightPostion2);
    let val = '';
    // 需要切除原来的变量
    if (leftPostion !== -1 && rightPostion !== -1 && leftPostion > leftPostion2) {
      left = left.substr(0, leftPostion);
      right = right.substr(rightPostion + 2);
      val = oldValue.substring(leftPostion, cursurPosition + rightPostion + 2);
    }
    return {
      left,
      right,
      val
    };
  };

  // 根据鼠标位置动态插入数据
  changeInstallParam = (name, v, index, key) => {
    key = key || 'value';
    const pathParam = deepCopyJson(this.state[name]);
    let oldValue = pathParam[index][key] || '';
    let newValue = this.getInstallValue(oldValue, this.state.cursurPosition);
    let left = newValue.left;
    let right = newValue.right;
    pathParam[index][key] = `${left}${v}${right}`;
    this.setState({
      [name]: pathParam
    });
  };

  // 取消参数插入
  handleModalCancel = () => {
    this.setState({ modalVisible: false, cursurPosition: -1 });
  };

  // 环境变量模态框相关操作
  showEnvModal = () => {
    this.setState({
      envModalVisible: true
    });
  };

  handleEnvOk = (newEnv, index) => {
    this.setState({
      envModalVisible: false,
      case_env: newEnv[index].name
    });
  };

  handleEnvCancel = () => {
    this.setState({
      envModalVisible: false
    });
  };

  render() {
    const {
      method,
      env,
      path,
      req_params = [],
      req_headers = [],
      req_query = [],
      req_body_type,
      req_body_form = [],
      loading,
      case_env,
      inputValue,
      hasPlugin
    } = this.state;

    return (
      <div className="interface-test postman">
        {this.state.modalVisible && (
          <ModalPostman
            visible={this.state.modalVisible}
            handleCancel={this.handleModalCancel}
            handleOk={this.handleModalOk}
            inputValue={inputValue}
            envType={this.props.type}
            id={+this.state._id}
          />
        )}

        {this.state.envModalVisible && (
          <Modal
            title="环境设置"
            visible={this.state.envModalVisible}
            onOk={this.handleEnvOk}
            onCancel={this.handleEnvCancel}
            footer={null}
            width={800}
            className="env-modal"
          >
            <ProjectEnv projectId={this.props.data.project_id} onOk={this.handleEnvOk} />
          </Modal>
        )}
        <CheckCrossInstall hasPlugin={hasPlugin} />

        <div className="url">
          <InputGroup compact style={{ display: 'flex' }}>
            <Select disabled value={method} style={{ flexBasis: 60 }}>
              {Object.keys(HTTP_METHOD).map(name => {
                <Option value={name.toUpperCase()}>{name.toUpperCase()}</Option>;
              })}
            </Select>
            <Select
              value={case_env}
              style={{ flexBasis: 180, flexGrow: 1 }}
              onSelect={this.selectDomain}
            >
              {env.map((item, index) => (
                <Option value={item.name} key={index}>
                  {item.name + '：' + item.domain}
                </Option>
              ))}
              <Option value="环境配置" disabled style={{ cursor: 'pointer', color: '#2395f1' }}>
                <Button type="primary" onClick={this.showEnvModal}>
                  环境配置
                </Button>
              </Option>
            </Select>

            <Input
              disabled
              value={path}
              onChange={this.changePath}
              spellCheck="false"
              style={{ flexBasis: 180, flexGrow: 1 }}
            />
          </InputGroup>

          <Tooltip
            placement="bottom"
            title={(() => {
              if (hasPlugin) {
                return '发送请求';
              } else {
                return '请安装 cross-request 插件';
              }
            })()}
          >
            <Button
              disabled={!hasPlugin}
              onClick={this.reqRealInterface}
              type="primary"
              style={{ marginLeft: 10 }}
              icon={loading ? 'loading' : ''}
            >
              {loading ? '取消' : '发送'}
            </Button>
          </Tooltip>

          <Tooltip
            placement="bottom"
            title={() => {
              return this.props.type === 'inter' ? '保存到测试集' : '更新该用例';
            }}
          >
            <Button onClick={this.props.save} type="primary" style={{ marginLeft: 10 }}>
              {this.props.type === 'inter' ? '保存' : '更新'}
            </Button>
          </Tooltip>
        </div>

        <Collapse defaultActiveKey={['0', '1', '2', '3']} bordered={true}>
          <Panel
            header="PATH PARAMETERS"
            key="0"
            className={req_params.length === 0 ? 'hidden' : ''}
          >
            {req_params.map((item, index) => {
              return (
                <div key={index} className="key-value-wrap">
                  <Tooltip
                    placement="topLeft"
                    title={<TooltipContent example={item.example} desc={item.desc} />}
                  >
                    <Input disabled value={item.name} className="key" />
                  </Tooltip>
                  <span className="eq-symbol">=</span>
                  <Input
                    value={item.value}
                    className="value"
                    onChange={e => this.changeParam('req_params', e.target.value, index)}
                    placeholder="参数值"
                    id={`req_params_${index}`}
                    addonAfter={
                      <Icon
                        type="edit"
                        onClick={() => this.showModal(item.value, index, 'req_params')}
                      />
                    }
                  />
                </div>
              );
            })}
            <Button
              style={{ display: 'none' }}
              type="primary"
              icon="plus"
              onClick={this.addPathParam}
            >
              添加Path参数
            </Button>
          </Panel>
          <Panel
            header="QUERY PARAMETERS"
            key="1"
            className={req_query.length === 0 ? 'hidden' : ''}
          >
            {req_query.map((item, index) => {
              return (
                <div key={index} className="key-value-wrap">
                  <Tooltip
                    placement="topLeft"
                    title={<TooltipContent example={item.example} desc={item.desc} />}
                  >
                    <Input disabled value={item.name} className="key" />
                  </Tooltip>
                  &nbsp;
                  {item.required == 1 ? (
                    <Checkbox className="params-enable" checked={true} disabled />
                  ) : (
                    <Checkbox
                      className="params-enable"
                      checked={item.enable}
                      onChange={e =>
                        this.changeParam('req_query', e.target.checked, index, 'enable')
                      }
                    />
                  )}
                  <span className="eq-symbol">=</span>
                  <Input
                    value={item.value}
                    className="value"
                    onChange={e => this.changeParam('req_query', e.target.value, index)}
                    placeholder="参数值"
                    id={`req_query_${index}`}
                    addonAfter={
                      <Icon
                        type="edit"
                        onClick={() => this.showModal(item.value, index, 'req_query')}
                      />
                    }
                  />
                </div>
              );
            })}
            <Button style={{ display: 'none' }} type="primary" icon="plus" onClick={this.addQuery}>
              添加Query参数
            </Button>
          </Panel>
          <Panel header="HEADERS" key="2" className={req_headers.length === 0 ? 'hidden' : ''}>
            {req_headers.map((item, index) => {
              return (
                <div key={index} className="key-value-wrap">
                  <Input disabled value={item.name} className="key" />
                  <span className="eq-symbol">=</span>
                  <Input
                    value={item.value}
                    disabled={!!item.abled}
                    className="value"
                    onChange={e => this.changeParam('req_headers', e.target.value, index)}
                    placeholder="参数值"
                    id={`req_headers_${index}`}
                    addonAfter={
                      !item.abled && (
                        <Icon
                          type="edit"
                          onClick={() => this.showModal(item.value, index, 'req_headers')}
                        />
                      )
                    }
                  />
                </div>
              );
            })}
            <Button style={{ display: 'none' }} type="primary" icon="plus" onClick={this.addHeader}>
              添加Header
            </Button>
          </Panel>
          <Panel
            header={
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Tooltip title="F9 全屏编辑">BODY(F9)</Tooltip>
              </div>
            }
            key="3"
            className={
              HTTP_METHOD[method].request_body &&
              ((req_body_type === 'form' && req_body_form.length > 0) || req_body_type !== 'form')
                ? 'POST'
                : 'hidden'
            }
          >
            <div
              style={{ display: checkRequestBodyIsRaw(method, req_body_type) ? 'block' : 'none' }}
            >
              {req_body_type === 'json' && (
                <div className="adv-button">
                  <Button
                    onClick={() => this.showModal(this.state.req_body_other, 0, 'req_body_other')}
                  >
                    高级参数设置
                  </Button>
                  <Tooltip title="高级参数设置只在json字段值中生效">
                    {'  '}
                    <Icon type="question-circle-o" />
                  </Tooltip>
                </div>
              )}

              <AceEditor
                className="pretty-editor"
                ref={editor => (this.aceEditor = editor)}
                data={this.state.req_body_other}
                mode={req_body_type === 'json' ? null : 'text'}
                onChange={this.handleRequestBody}
                fullScreen={true}
              />
            </div>

            {HTTP_METHOD[method].request_body &&
              req_body_type === 'form' && (
                <div>
                  {req_body_form.map((item, index) => {
                    return (
                      <div key={index} className="key-value-wrap">
                        <Tooltip
                          placement="topLeft"
                          title={<TooltipContent example={item.example} desc={item.desc} />}
                        >
                          <Input disabled value={item.name} className="key" />
                        </Tooltip>
                        &nbsp;
                        {item.required == 1 ? (
                          <Checkbox className="params-enable" checked={true} disabled />
                        ) : (
                          <Checkbox
                            className="params-enable"
                            checked={item.enable}
                            onChange={e => this.changeBody(e.target.checked, index, 'enable')}
                          />
                        )}
                        <span className="eq-symbol">=</span>
                        {item.type === 'file' ? (
                          <Input
                            type="file"
                            id={'file_' + index}
                            onChange={e => this.changeBody(e.target.value, index, 'value')}
                            multiple
                            className="value"
                          />
                        ) : (
                          <Input
                            value={item.value}
                            className="value"
                            onChange={e => this.changeBody(e.target.value, index)}
                            placeholder="参数值"
                            id={`req_body_form_${index}`}
                            addonAfter={
                              <Icon
                                type="edit"
                                onClick={() => this.showModal(item.value, index, 'req_body_form')}
                              />
                            }
                          />
                        )}
                      </div>
                    );
                  })}
                  <Button
                    style={{ display: 'none' }}
                    type="primary"
                    icon="plus"
                    onClick={this.addBody}
                  >
                    添加Form参数
                  </Button>
                </div>
              )}
            {HTTP_METHOD[method].request_body &&
              req_body_type === 'file' && (
                <div>
                  <Input type="file" id="single-file" />
                </div>
              )}
          </Panel>
        </Collapse>

        <Tabs size="large" defaultActiveKey="res" className="response-tab">
          <Tabs.TabPane tab="Response" key="res">
            <Spin spinning={this.state.loading}>
              <h2
                style={{ display: this.state.resStatusCode ? '' : 'none' }}
                className={
                  'res-code ' +
                  (this.state.resStatusCode >= 200 &&
                  this.state.resStatusCode < 400 &&
                  !this.state.loading
                    ? 'success'
                    : 'fail')
                }
              >
                {this.state.resStatusCode + '  ' + this.state.resStatusText}
              </h2>

              <div className="container-header-body">
                <div className="header">
                  <div className="container-title">
                    <h4>Headers</h4>
                  </div>
                  <AceEditor
                    callback={editor => {
                      editor.renderer.setShowGutter(false);
                    }}
                    readOnly={true}
                    className="pretty-editor-header"
                    data={this.state.test_res_header}
                    mode="json"
                  />
                </div>
                <div className="resizer">
                  <div className="container-title">
                    <h4 style={{ visibility: 'hidden' }}>1</h4>
                  </div>
                </div>
                <div className="body">
                  <div className="container-title">
                    <h4>Body</h4>
                  </div>
                  <AceEditor
                    readOnly={true}
                    className="pretty-editor-body"
                    data={this.state.test_res_body}
                    mode={handleContentType(this.state.test_res_header)}
                  />
                </div>
              </div>
            </Spin>
          </Tabs.TabPane>
          {this.props.type === 'case' ? (
            <Tabs.TabPane
              className="response-test"
              tab={<Tooltip title="测试脚本，可断言返回结果，使用方法请查看文档">Test</Tooltip>}
              key="test"
            >
              <h3 style={{ margin: '5px' }}>
                &nbsp;是否开启:&nbsp;
                <Switch
                  checked={this.state.enable_script}
                  onChange={e => this.setState({ enable_script: e })}
                />
              </h3>
              <p style={{ margin: '10px' }}>注：Test 脚本只有做自动化测试才执行</p>
              <Row>
                <Col span="18">
                  <AceEditor
                    onChange={this.onOpenTest}
                    className="case-script"
                    data={this.state.test_script}
                    ref={aceEditor => {
                      this.aceEditor = aceEditor;
                    }}
                  />
                </Col>
                <Col span="6">
                  <div className="insert-code">
                    {InsertCodeMap.map(item => {
                      return (
                        <div
                          style={{ cursor: 'pointer' }}
                          className="code-item"
                          key={item.title}
                          onClick={() => {
                            this.handleInsertCode('\n' + item.code);
                          }}
                        >
                          {item.title}
                        </div>
                      );
                    })}
                  </div>
                </Col>
              </Row>
            </Tabs.TabPane>
          ) : null}
        </Tabs>
      </div>
    );
  }
}

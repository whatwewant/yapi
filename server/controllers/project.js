import projectModel from '../models/project.js'
import yapi from '../yapi.js'
import baseController from './base.js'
import interfaceModel from '../models/interface.js'
import userModel from '../models/user.js'
import groupModel from '../models/group'

class projectController extends baseController {

    constructor(ctx){
        super(ctx)
        this.Model = yapi.getInst(projectModel);
        this.groupModel = yapi.getInst(groupModel);
    }

    /**
     * 添加项目分组
     * @interface /project/add
     * @method POST
     * @category project
     * @foldnumber 10
     * @param {String} name 项目名称，不能为空
     * @param {String} basepath 项目基本路径，不能为空
     * @param {String} prd_host 项目线上域名，不能为空。可通过配置的域名访问到mock数据
     * @param {Number} group_id 项目分组id，不能为空
     * @param  {String} [desc] 项目描述 
     * @returns {Object} 
     * @example ./api/project/add.json
     */
    async add(ctx) {
        let params = ctx.request.body;

        if(!params.group_id){
            return ctx.body = yapi.commons.resReturn(null, 400, '项目分组id不能为空');
        }

        if(!params.name){
            return ctx.body = yapi.commons.resReturn(null, 400, '项目名不能为空');
        }

        let checkRepeat = await this.Model.checkNameRepeat(params.name);
        if(checkRepeat > 0){
            return ctx.body =  yapi.commons.resReturn(null, 401, '已存在的项目名');
        }

        if(!params.basepath){
            return ctx.body = yapi.commons.resReturn(null, 400, '项目basepath不能为空');
        }
        if(!params.prd_host){
            return ctx.body = yapi.commons.resReturn(null, 400, '项目domain不能为空');
        }

        let checkRepeatDomain = await this.Model.checkDomainRepeat(params.prd_host, params.basepath);
        if(checkRepeatDomain > 0){
            return ctx.body =  yapi.commons.resReturn(null, 401, '已存在domain和basepath');
        }
        
        let data = {
            name: params.name,
            desc: params.desc,
            prd_host: params.prd_host,
            basepath: params.basepath,
            members: [this.getUid()],
            uid: this.getUid(),
            group_id: params.group_id,
            add_time: yapi.commons.time(),
            up_time: yapi.commons.time()
        }

        try{
            let result = await this.Model.save(data);           
            ctx.body = yapi.commons.resReturn(result);
        }catch(e){
            ctx.body = yapi.commons.resReturn(null, 402, e.message)
        }
        
    }
     /**
     * 添加项目成员
     * @interface /project/add_member
     * @method POST
     * @category project
     * @foldnumber 10
     * @param {Number} id 项目id，不能为空
     * @param {String} member_uid 项目成员uid,不能为空
     * @returns {Object} 
     * @example ./api/project/add_member.json
     */
    async addMember(ctx){
        let params = ctx.request.body;
        if(!params.member_uid){
            return ctx.body = yapi.commons.resReturn(null, 400, '项目成员uid不能为空');
        }
        if(!params.id){
            return ctx.body = yapi.commons.resReturn(null, 400, '项目id不能为空');
        }

        var check = await this.Model.checkMemberRepeat(params.id, params.member_uid);
        if(check > 0){
             return ctx.body = yapi.commons.resReturn(null, 400, '项目成员已存在');
        }
        try{
            let result = await this.Model.addMember(params.id, params.member_uid);
            ctx.body = yapi.commons.resReturn(result);
        }catch(e){
            ctx.body = yapi.commons.resReturn(null, 402, e.message)
        }

    }
     /**
     * 删除项目成员
     * @interface /project/del_member
     * @method POST
     * @category project
     * @foldnumber 10
     * @param {Number} id 项目id，不能为空
     * @param {member_uid} uid 项目成员uid,不能为空
     * @returns {Object} 
     * @example ./api/project/del_member.json
     */

    async delMember(ctx){
        let params = ctx.request.body;
        if(!params.member_uid){
            return ctx.body = yapi.commons.resReturn(null, 400, '项目成员uid不能为空');
        }
        if(!params.id){
            return ctx.body = yapi.commons.resReturn(null, 400, '项目id不能为空');
        }
        var check = await this.Model.checkMemberRepeat(params.id, params.member_uid);
        if(check === 0){
             return ctx.body = yapi.commons.resReturn(null, 400, '项目成员不存在');
        }

         try{
            let result = await this.Model.delMember(params.id, params.member_uid);
            ctx.body = yapi.commons.resReturn(result);
        }catch(e){
            ctx.body = yapi.commons.resReturn(null, 402, e.message)
        }
    }

    /**
     * 获取项目成员列表
     * @interface /project/get_member_list.json
     * @method GET
     * @category project
     * @foldnumber 10
     * @param {Number} id 项目id，不能为空
     * @return {Object}
     * @example ./api/project/get_member_list.json
     */

    async getMemberList(ctx) {
        let params = ctx.request.query;
        if(!params.id) {
            return ctx.body = yapi.commons.resReturn(null, 400, '项目id不能为空');
        }

        try {
            let project = await this.Model.get(params.id);
            let userInst = yapi.getInst(userModel);
            let result = [];

            for(let i of project.members) {
                let user = await userInst.findById(i);
                result.push(user);
            }

            ctx.body = yapi.commons.resReturn(result);
        } catch(e) {
            ctx.body = yapi.commons.resReturn(null, 402, e.message);
        }
    }


     /**
     * 添加项目
     * @interface /project/get
     * @method GET
     * @category project
     * @foldnumber 10
     * @param {Number} id 项目id，不能为空
     * @returns {Object} 
     * @example ./api/project/get.json
     */

    async get(ctx){
        let params = ctx.request.query;
        if(!params.id){
            return ctx.body = yapi.commons.resReturn(null, 400, '项目id不能为空');
        }
        try{
            let result = await this.Model.get(params.id);
            ctx.body = yapi.commons.resReturn(result);
        }catch(e){
            ctx.body = yapi.commons.resReturn(null, 402, e.message)
        }
    }

    /**
     * 获取项目列表
     * @interface /project/list
     * @method GET
     * @category project
     * @foldnumber 10
     * @param {Number} group_id 项目group_id，不能为空
     * @returns {Object} 
     * @example ./api/project/list.json
     */

    async list(ctx) {
        let group_id = ctx.request.query.group_id;
        if(!group_id){
            return ctx.body = yapi.commons.resReturn(null, 400, '项目分组id不能为空');
        }
        try{
            let result = await this.Model.list(group_id);
            ctx.body = yapi.commons.resReturn(result)
        }catch(err){
             ctx.body = yapi.commons.resReturn(null, 402, e.message)
        }
    }

    /**
     * 删除项目
     * @interface /project/del
     * @method POST
     * @category project
     * @foldnumber 10
     * @param {Number} id 项目id，不能为空
     * @returns {Object} 
     * @example ./api/project/del.json
     */

    async del(ctx){   
        try{
            let id = ctx.request.body.id;
            if(!id){
                return ctx.body = yapi.commons.resReturn(null, 400, '项目id不能为空');
            }
            let interfaceInst = yapi.getInst(interfaceModel);
            let count = await interfaceInst.countByProjectId(id);
            if(count > 0){
                return ctx.body = yapi.commons.resReturn(null, 400, '请先删除该项目下所有接口');
            }

            if(await this.jungeProjectAuth(id) !== true){
                return ctx.body = yapi.commons.resReturn(null, 405, '没有权限');
            }
            let result = await this.Model.del(id);
            ctx.body = yapi.commons.resReturn(result);
        }catch(err){
             ctx.body = yapi.commons.resReturn(null, 402, e.message)
        }
    }

    /**
     * 编辑项目
     * @interface /project/up
     * @method GET
     * @category project
     * @foldnumber 10
     * @param {Number} id 项目id，不能为空
     * @param {String} name 项目名称，不能为空
     * @param {String} basepath 项目基本路径，不能为空
     * @param {String} prd_host 项目线上域名，不能为空。可通过配置的域名访问到mock数据
     * @param {String} [desc] 项目描述 
     * @param {Array} [env] 项目环境配置
     * @param {String} [env[].name] 环境名称
     * @param {String} [env[].host] 环境域名
     * @returns {Object} 
     * @example ./api/project/up.json
     */

    async up(ctx){
        try{            
            let id = ctx.request.body.id;
            let params = ctx.request.body;

            if(await this.jungeMemberAuth(id, this.getUid()) !== true){
                return ctx.body = yapi.commons.resReturn(null, 405, '没有权限');
            }

            if(params.name){
                let checkRepeat = await this.Model.checkNameRepeat(params.name);
                if(checkRepeat > 0){
                    return ctx.body =  yapi.commons.resReturn(null, 401, '已存在的项目名');
                }
            }

            if(params.basepath && params.prd_host){
                let checkRepeatDomain = await this.Model.checkDomainRepeat(params.prd_host, params.basepath);
                if(checkRepeatDomain > 0){
                    return ctx.body =  yapi.commons.resReturn(null, 401, '已存在domain和basepath');
                }
            }

            let data= {
                uid: this.getUid(),
                up_time: yapi.commons.time()
            }

            if(params.name) data.name = params.name;
            if(params.desc) data.desc = params.desc;
            if(params.prd_host && params.basepath){
                data.prd_host = params.prd_host;
                data.basepath = params.basepath;
            }
            if(params.env) data.env = params.env;

            let result = await this.Model.up(id, data);
            ctx.body = yapi.commons.resReturn(result)
        }catch(e){
             ctx.body = yapi.commons.resReturn(null, 402, e.message)
        }
    }

    /**
     * 模糊搜索项目名称或者组名称
     * @interface /project/search
     * @method GET
     * @category project
     * @foldnumber 10
     * @param {String} q
     * @return {Object}
     * @example ./api/project/search.json
    */
    async search(ctx) {
        const { q } = ctx.request.query;

        if (!q) {
            return ctx.body = yapi.commons.resReturn(void 0, 400, 'No keyword.')
        }

        if (!yapi.commons.validateSearchKeyword(q)) {
            return ctx.body = yapi.commons.resReturn(void 0, 400, 'Bad query.')
        }

        let queryList = {
            project: await this.Model.search(q),
            group: await this.groupModel.search(q)
        }
        
        return ctx.body = yapi.commons.resReturn(queryList, 200, 'ok')
    }
}

module.exports = projectController;
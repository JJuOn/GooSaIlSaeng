const cheerio=require('cheerio')
const rp=require('request-promise')
const pool=require('../../pool')
const iconv=require('iconv-lite')
require('dotenv').config()
exports.SetAll=(req,res)=>{
    let cookie
    const Login=async ()=>{
        try{
            const option={
                uri:`https://everytime.kr/user/login?userid=${process.env.ET_ID}&password=${process.env.ET_PASSWORD}&redirect=%2F`,
                headers:{
                    Accept:'text/html,application/xhtml+xml,application/xml',
                    'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36',
                    Connection:'keep-alive',
                    'Cache-Control':'max-age=0',
                    origin:'https://evertyime.kr',
                    referrer:'https://everytime.kr/',
                    'Upgrade-Insecure-Requests':'1'
                },
                json:true,
                resolveWithFullResponse:true,
                simple:false,
            }
            const loginRes = await rp.post(option)
            if (loginRes.statusCode!==302){
                return Promise.reject({
                    code:'everytime_login_error',
                    message:'Fail to login everytime, Check your ID or password'
                })
            }
            cookie=loginRes.headers['set-cookie'][0]
            return Promise.resolve()
        }
        catch (e) {
            return Promise.reject(e)
        }
    }
    const GetMajorList=async ()=>{
        try{
            const option={
                uri:'https://everytime.kr/find/timetable/subject/filter/list?year=2019&semester=2',
                headers:{
                    cookie:cookie,
                    'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36',
                },
            }
            const body=await rp.post(option)
            return Promise.resolve(body)
        }
        catch (err){
            return Promise.reject(err)
        }
    }
    const MakeMajorTree=(body)=>{
        let tree=[{campus:'8',category:[]},{campus:'9',category:[]}]
        let $=cheerio.load(body,{xmlMode:true})
        let campuses=$('response').find('campus')
        for(let i=0;i<campuses.length;i++){
            if($(campuses[i]).attr('id')==='8'){
                let categories=$(campuses[i]).children('categories').find('category')
                for(let j=0;j<categories.length;j++){
                    if(!$(categories[j]).attr('parentId')){
                        tree[0]['category'].push({id:$(categories[j]).attr('id'),name:$(categories[j]).attr('name'),child:[]})
                    }
                    else{
                        for(let k=0;k<tree[0]['category'].length;k++){
                            if(tree[0]['category'][k]['id']===$(categories[j]).attr('parentId')){
                                tree[0]['category'][k]['child'].push({id:$(categories[j]).attr('id'),name:$(categories[j]).attr('name'),child:[]})
                            }
                            else{
                                for(let l=0;l<tree[0]['category'][k]['child'].length;l++){
                                    if(tree[0]['category'][k]['child'][l]['id']===$(categories[j]).attr('parentId')){
                                        tree[0]['category'][k]['child'][l]['child'].push({id:$(categories[j]).attr('id'),name:$(categories[j]).attr('name'),child:[]})
                                        break
                                    }
                                }
                            }
                        }
                    }
                }
            }
            else {
                let categories=$(campuses[i]).children('categories').find('category')
                for(let j=0;j<categories.length;j++){
                    if(!$(categories[j]).attr('parentId')){
                        tree[1]['category'].push({id:$(categories[j]).attr('id'),name:$(categories[j]).attr('name'),child:[]})
                    }
                    else{
                        for(let k=0;k<tree[1]['category'].length;k++){
                            if(tree[1]['category'][k]['id']===$(categories[j]).attr('parentId')){
                                tree[1]['category'][k]['child'].push({id:$(categories[j]).attr('id'),name:$(categories[j]).attr('name'),child:[]})
                            }
                            else{
                                for(let l=0;l<tree[1]['category'][k]['child'].length;l++){
                                    if(tree[1]['category'][k]['child'][l]['id']===$(categories[j]).attr('parentId')){
                                        tree[1]['category'][k]['child'][l]['child'].push({id:$(categories[j]).attr('id'),name:$(categories[j]).attr('name'),child:[]})
                                        break
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return Promise.resolve(tree)
    }
    const BeautifyTree=(tree)=>{
        let ids=[]
        for(let i=0;i<tree.length;i++){
            for(let j=0;j<tree[i]['category'].length;j++){
                if(tree[i]['category'][j]['child'].length===0){
                    ids.push({campus:tree[i]['campus'],id:tree[i]['category'][j]['id']});
                    delete tree[i]['category'][j]['child']
                }
                else{
                    for(let k=0;k<tree[i]['category'][j]['child'].length;k++){
                        if (tree[i]['category'][j]['child'][k]['child'].length===0){
                            ids.push({campus:tree[i]['campus'],id:tree[i]['category'][j]['child'][k]['id']});
                            delete tree[i]['category'][j]['child'][k]['child']
                        }
                        else{
                            for(let l=0;l<tree[i]['category'][j]['child'][k]['child'].length;l++){
                                if(tree[i]['category'][j]['child'][k]['child'][l]['child'].length===0){
                                    ids.push({campus:tree[i]['campus'],id:tree[i]['category'][j]['child'][k]['child'][l]['id']});
                                    delete tree[i]['category'][j]['child'][k]['child'][l]['child']
                                }
                            }
                        }
                    }
                }
            }
        }
        return Promise.resolve(ids)
    }
    const GetSubjects=async (ids)=>{
        let result=[]
        for(let i=0;i<ids.length;i++){
            let startNum=0
            while (true){
                try{
                    const option={
                        uri:`https://everytime.kr/find/timetable/subject/list?categoryId=${ids[i].id}&campusId=${ids[i].campus}&year=2019&semester=2&limitNum=50&startNum=${startNum}`,
                        headers:{
                            cookie:cookie
                        }
                    }
                    const body=await rp.post(option)
                    const $=cheerio.load(body,{xmlMode:true})
                    const subjects=$('response').find('subject')
                    if(subjects.length===0){
                        break
                    }
                    else{
                        for(let j=0;j<subjects.length;j++){
                            const timeplaces=$(subjects[j]).find('timeplace')
                            const professor=$(subjects[j]).attr('professor')
                            const professorArr=professor.split('/')
                            for (let l=0;l<professorArr.length;l++){
                                for(let k=0;k<timeplaces.length;k++){
                                    result.push({
                                        SubCode:$(subjects[j]).attr('code'),
                                        SubName:$(subjects[j]).attr('name'),
                                        Day:$(timeplaces[k]).attr('day'),
                                        BeginTime:$(timeplaces[k]).attr('start'),
                                        EndTime:$(timeplaces[k]).attr('end'),
                                        Room:$(timeplaces[k]).attr('place'),
                                        Professor:professorArr[l].trim()
                                    })
                                }
                            }
                        }
                        startNum+=50
                    }
                }
                catch (err){
                    console.error(err)
                    return Promise.reject(err)
                }
            }
        }
        return Promise.resolve(result)
    }
    const Create=async (result)=>{

        try{
            const connection=await pool.getConnection(async conn=>conn)
            try{
                for(let i=0;i<result.length;i++){
                    const temp=await connection.query(`INSERT INTO SUBJECT (CODE,NAME,DAY,BEGINTIME,ENDTIME,ROOM,PROFESSOR,YEAR,SEMESTER) VALUES (?,?,?,?,?,?,?,?,?)`, [result[i].SubCode,result[i].SubName,result[i].Day,result[i].BeginTime,result[i].EndTime,result[i].Room,result[i].Professor,'2019','2'])
                }
                    connection.release()
            }
            catch (err){
                console.error(err)
                return Promise.reject(err)
            }
        }
        catch (err) {
            console.error(err)
            return Promise.reject(err)
        }
        return Promise.resolve()
    }
    Login()
        .then(GetMajorList)
        .then(MakeMajorTree)
        .then(BeautifyTree)
        .then(GetSubjects)
        .then(Create)
        .then(()=>{
            res.status(200).end("All Done.")
        })
        .catch((err)=>{
            console.error(err);
            res.status(500).json(err.message|err)
        })
}
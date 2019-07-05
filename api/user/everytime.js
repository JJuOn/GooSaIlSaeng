const rp=require('request-promise').defaults({jar:true})
const cheerio=require('cheerio')
const convert=require('xml-js')

exports.Everytime=(req,res)=>{
    const etId=req.body.etId
    const etPassword=req.body.etPassword
    let cookie
    const DataCheck=()=>{
        return new Promise((resolve,reject)=>{
            if(!etId || !etPassword){
                return reject({
                    code: 'request_body_error',
                    message: 'Request body is not defined.'
                })
            }
            else resolve()
        })
    }
    const Login=async ()=>{
        try{
            const option={
                uri:`https://everytime.kr/user/login?userid=${etId}&password=${etPassword}&redirect=%2F`,
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
    const GetTimetableList=async ()=>{
        try{
            const option={
                uri:'http://everytime.kr/find/timetable/table/list/semester?year=2019&semester=1',
                headers:{
                    cookie:cookie,
                    'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36',
                },
                json:true,
                followAllRedirects:true,
            }
            const timetableListBody=await rp.get(option)
            return Promise.resolve(timetableListBody)
        }
        catch (e) {
            return Promise.reject(e)
        }
    }
    const GetTimetable=async (tableList)=>{
        try{
            let tableId
            let $=cheerio.load(tableList,{xmlMode:true})
            let tables=$('response').find('table')
            for(let i=0;i<tables.length;i++){
                if($(tables[i]).attr('is_primary')==='1'){
                    tableId=$(tables[i]).attr('id')
                }
            }
            if(!tableId){
                return Promise.reject({
                    code:'no_timetable',
                    message:'There is no timetable in this semester.'
                })
            }
            const option={
                uri:`https://everytime.kr/find/timetable/table?id=${tableId}`,
                headers:{
                    cookie:cookie,
                    'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36',
                },
            }
            const timetableBody=await rp.post(option)
            return Promise.resolve(timetableBody)
        }
        catch (e) {
            return Promise.reject(e)
        }
    }
    const MakeJSON=(xmlContent)=>{
        const jsonContent = convert.xml2json(xmlContent,{compact:true, spaces:4})
        const parsed=JSON.parse(jsonContent)
        return Promise.resolve(parsed)
    }
    DataCheck()
        .then(Login)
        .then(GetTimetableList)
        .then(GetTimetable)
        .then(MakeJSON)
        .then((timetableResult)=>{
            res.status(200).json(timetableResult)
        })
        .catch((err)=>{
            res.status(500).json(err)
        })
}
const rp=require('request-promise').defaults({jar:true})
const cheerio=require('cheerio')
const pool=require('../../pool')

exports.Everytime=(req,res)=>{
    const etId=req.body.etId
    const etPassword=req.body.etPassword
    let id
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
    const GetId=async ()=>{
        try{
            const connection=await pool.getConnection(async conn=>conn)
            try{
                const [users] = await connection.query(`SELECT * FROM USER WHERE (USERID='${req.session.sid}')`)
                //console.log(users)
                connection.release()
                id= users[0].id
                return Promise.resolve()
            }
            catch (e) {
                console.error(e)
                return Promise.reject(e)
            }
        }
        catch (e) {
            console.error(e)
            return Promise.reject(e)
        }
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
                uri:'http://everytime.kr/find/timetable/table/list/semester?year=2019&semester=2',
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
    const Update=async (timetableBody)=>{
        let results=[]
        const $=cheerio.load(timetableBody,{xmlMode:true})
        const table=$('response').find('table')
        const subjects=$(table[0]).find('subject')
        for(let i=0;i<subjects.length;i++){
            const code=$(subjects[i]).children('internal').attr('value')
            const name=$(subjects[i]).children('name').attr('value')
            const time=$(subjects[i]).children('time').find('data')
            for(let j=0;j<time.length;j++){
                const day=$(time[j]).attr('day')
                const startTime=$(time[j]).attr('starttime')
                const endTime=$(time[j]).attr('endtime')
                const place=$(time[j]).attr('place')
                results.push({
                    code:code,
                    name:name,
                    day:day,
                    startTime:startTime,
                    endTime:endTime,
                    place:place,
                    owner:id,
                })
            }
        }
        console.log(results)
        try{
            const connection=await pool.getConnection(async conn=>conn)
            try{
                for(let i=0;i<results.length;i++){
                    const temp=await connection.query(`INSERT INTO SCHEDULE (CODE,NAME,DAY,BEGINTIME,ENDTIME,PLACE,OWNER,YEAR,SEMESTER,ISEXAM,ISREPEAT) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,[results[i].code,results[i].name,results[i].day,results[i].startTime,results[i].endTime,results[i].place,results[i].owner,'2019','2','0','1'])
                    console.log(temp)
                }
                connection.release()
                return Promise.resolve()
            }
            catch (e) {
                console.error(e)
                return Promise.reject(e)
            }
        }
        catch (e) {
            console.error(e)
            return Promise.reject(e)
        }
    }

    DataCheck()
        .then(GetId)
        .then(Login)
        .then(GetTimetableList)
        .then(GetTimetable)
        .then(Update)
        .then(()=>{
            res.status(200).end('All Done')
        })
        .catch((err)=>{
            res.status(500).json(err)
        })
}
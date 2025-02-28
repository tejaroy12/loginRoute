const express = require('express')
const app = express()
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
app.use(express.json())
const dbPath = path.join(__dirname, 'covid19IndiaPortal.db')
let db = null
const initializeDbUser = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server listening on 3000')
    })
  } catch (e) {
    console.log(`DB error: ${e.message}`)
  }
}
initializeDbUser()
const verifyToken = (request, response, next) => {
  let jwtToken
  const authHeader = request.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid JWT Token')
  } else {
    jwt.verify(jwtToken, 'tjehshsh', async (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        request.username = payload.username
        next()
      }
    })
  }
}

app.post('/login', async (req, res) => {
  const {username, password} = req.body
  const getUsername = `
        select * from user where username='${username}';
    `
  const getQ = await db.get(getUsername)
  if (getQ !== undefined) {
    const isMatch = await bcrypt.compare(password, getQ.password)
    if (isMatch === true) {
      const payload = {username: username}
      const jwtToken = jwt.sign(payload, 'tjehshsh')
      res.send(jwtToken)
    } else {
      res.status(400).send('Invalid password')
    }
  } else {
    res.status(401).send('Invalid user')
  }
})

app.get('/states/', verifyToken, async (req, res) => {
  const getStates = `
        select * from state;
    `
  const state = await db.all(getStates)
  res.send(state)
})

app.get('/states/:stateId', verifyToken, async (req, res) => {
  const {stateId} = req.params
  const getStates = `
        select * from state where state_id=${stateId};
    `
  const state = await db.all(getStates)
  res.send(state)
})

app.post('/districts/', verifyToken, async (req, res) => {
  const details = req.body
  const {districtName, stateId, cases, surved, active, deaths} = details
  const getStates = `
        insert into district(district_name,state_id,cases,cured,active,deaths)
        values(
          '${districtName}',
          '${stateId}',
          '${cases}',
          '${surved}',
          '${active}',
          '${deaths}'
        );
    `
  const state = await db.run(getStates)
  res.send('District Successfully Added')
})

app.get('/districts/:districtId/', verifyToken, async (req, res) => {
  const {districtId} = req.params
  const getStates = `
        select * from district where district_id=${districtId};
    `
  const state = await db.get(getStates)
  res.send(state)
})

app.delete('/districts/:districtId/', verifyToken, async (req, res) => {
  const {districtId} = req.params
  const getStates = `
        delete from district where district_id=${districtId};
    `
  const state = await db.run(getStates)
  res.send('District Removed')
})

app.put('/districts/:districtId', verifyToken, async (req, res) => {
  const {districtId} = req.params
  const details = req.body
  const {districtName, stateId, cases, cured, active, deaths} = details
  const getUpdateQuery = `
    update district set district_name='${districtName}',
    state_id='${stateId}',cases='${cases}',cured='${cured}',active='${active}',deaths='${deaths}'
    where district_id=${districtId};
  `

  const upda = await db.run(getUpdateQuery)
  res.send('District Details Updated')
})

app.get('/states/:stateId/stats/', verifyToken, async (req, res) => {
  const {stateId} = req.params
  const gettotal = `
    select sum(cases) as totalCases, sum(cured) as totalCured,sum(active) as totalActive, sum(deaths) as totalDeaths from district where state_id=${stateId}
  `

  const getstats = await db.get(gettotal)
  res.send(getstats)
})

app.get('/districts/:districtId/details/', verifyToken, async (req, res) => {
  const {districtId} = req.params
  const state = `
    select state_name as stateName from state where state_id=${districtId};  `
  const stateu = await db.get(state)
  res.send(stateu)
})
module.exports = app

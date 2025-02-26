var { google } = require("googleapis")
var spreadsheetId = "1m77KyHuDXuP7SK6LYXMwfs135S4WYRgwHchJ0zX7ocM"
var path = require("path")
/*
авторизация в гугл таблицах инструкция: 
1) заходим на https://console.cloud.google.com
2) нажимаем на три полоски слева сверху => APIs & Services => Enabled APIs & services => сверху ENABLE APIS AND SERVICES
3) в поиске пишем google drive => первое => enable
4) нажимаем на три полоски слева сверху => APIs & Services => credentials => CREATE CREDENTIALS => Service account => заполняем первое поле => done
5) снизу находим только что созданные service account => нажимаем на карандашик слева => keys (сверху) => add key => create new key => json => create
6) скачавшийся файлик переименовываем в credentials.json и кладем в папку проекта
7) заходим в credentials.json и копируем оттуда пункт "client_email", даем ему доступ редактора в гугл таблице
8) заходим в нашу гугл таблицу и копируем id - это набор символов после "/d/" и до "/edit#"
*/

function google_auth() {
    var auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, "..", "credentials.json"),
        scopes: "https://www.googleapis.com/auth/spreadsheets"
    })
    
    const client = auth.getClient()
    const googleSheets = google.sheets({version: "v4", auth: client})
    return {googleSheets, auth}
}


async function writeNewPaymentToGoogleSheets(listToAdd, values) {
    var { googleSheets, auth } = google_auth()
    await googleSheets.spreadsheets.values.append({
        auth, 
        spreadsheetId,
        range: listToAdd,
        valueInputOption: "RAW",
        requestBody: {values: [values]}
    })
}

async function setAcceptedOrDenied(listToAdd, id, value) {
    var { googleSheets, auth } = google_auth()
    var rowId = await getRawById(listToAdd, id)
    if(typeof rowId == "undefined") return
    var letterOfRow = "J"
    if(listToAdd == "Наличные") letterOfRow = "K"
    await googleSheets.spreadsheets.values.update({
        auth,
        spreadsheetId,
        range: `${listToAdd}!${letterOfRow}${rowId}`,
        valueInputOption: "RAW",
        requestBody: {values: [[value]]}
    });
}

async function getRawById(list, neededId) {
    var { googleSheets, auth } = google_auth()
    var date = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: list + "!A:A"
    })
    var counter = 0
    for (id of date.data.values) {
        counter += 1
        if(id[0] == neededId) return counter
    }
}




module.exports = { writeNewPaymentToGoogleSheets, setAcceptedOrDenied }
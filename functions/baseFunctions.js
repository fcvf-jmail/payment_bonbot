const fs = require("fs")
const path = require("path")
const { chatToSendCash, chatToSendIpOrLlc } = require("../values")
const { setAcceptedOrDenied } = require("./googleSheets")
var baseFilePath = path.join(__dirname, "..", "payments.json")

function writeNewPaymentToBase(text, departmentName, listName, {document, photo} = {}) {
    var file = JSON.parse(fs.readFileSync(baseFilePath, "utf-8"))
    file[file.nextId] = {accepetedBy: [], deniedBy: [], text, departmentName, listName}
    if(document) file[file.nextId].document = document
    if(photo) file[file.nextId].photo = photo
    file.nextId += 1
    fs.writeFileSync(baseFilePath, JSON.stringify(file,  null, 4), "utf-8")
}

function acceptOrDenieThePayment(acceptOrDenie, paymentId, ctx) {
    var file = JSON.parse(fs.readFileSync(baseFilePath, "utf-8"))
    if(!file[paymentId]) return "Не могу найти этот платеж в базе"
    elIsInArray = file[paymentId].accepetedBy.includes(ctx.from.id) || file[paymentId].deniedBy.includes(ctx.from.id)
    if(elIsInArray) return "Вы уже дали свой ответ ранее"

    if(!elIsInArray) file[paymentId][acceptOrDenie].push(ctx.from.id)
    fs.writeFileSync(baseFilePath, JSON.stringify(file,  null, 4), "utf-8")

    var chatToSend = file[paymentId].listName == "Наличные" ? chatToSendCash : chatToSendIpOrLlc
    var usersToSend = file[paymentId].listName == "Наличные" ? getChatIds(file[paymentId].departmentName, "usersToSendCash") : getChatIds(file[paymentId].departmentName, "usersToSendIpOrLlc")
    if(file[paymentId].accepetedBy.length + file[paymentId].deniedBy.length == usersToSend.length) {
        setAcceptedOrDenied(file[paymentId].listName, paymentId, file[paymentId].deniedBy.length == 0 ? "Согласовано" : "Не согласовано")
        if(file[paymentId].deniedBy.length == 0) {
            if(file[paymentId].document) return ctx.telegram.sendDocument(chatToSend, file[paymentId].document, {caption: file[paymentId].text})
            if(file[paymentId].photo) return ctx.telegram.sendPhoto(chatToSend, file[paymentId].photo, {caption: file[paymentId].text})
            return ctx.telegram.sendMessage(chatToSend, {text: file[paymentId].text})
        }
    }
    return "Ваш ответ принят"
}

function getChatIds(department, list) {
    console.log("department: " + department);
    console.log("list: " + list);
    var values = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "chatIds.json"), "utf-8"))
    return values[department][list]
}

module.exports = { writeNewPaymentToBase, acceptOrDenieThePayment, getChatIds }
const { Scenes } = require("telegraf")
const path = require("path")
const { writeNewPaymentToBase, getChatIds } = require("../functions/baseFunctions")
var fs = require("fs")
const { baseFilePath } = require("../values")
const { writeNewPaymentToGoogleSheets } = require("../functions/googleSheets")
const { cancelAdding } = require("../functions/repliersFunctions")

module.exports = new Scenes.WizardScene("cashScene",
    ctx => {
        ctx.scene.session.state.payment = {id: JSON.parse(fs.readFileSync(baseFilePath, "utf-8")).nextId, nick: ctx.from.username, name: ctx.from.first_name, department: ctx.scene.session.state.department}
        ctx.reply("Укажите дату платежа")
        return ctx.wizard.next()
    },
    ctx => {
        if(ctx.callbackQuery) return
        try {if(ctx.message.text == "/cancel") return cancelAdding(ctx)} catch(err) {}
        ctx.scene.session.state.payment.date = ctx.message.text
        ctx.reply("Укажите сумму")
        return ctx.wizard.next()
    },
    ctx => {
        if(ctx.callbackQuery) return
        try {if(ctx.message.text == "/cancel") return cancelAdding(ctx)} catch(err) {}
        ctx.scene.session.state.payment.summ = ctx.message.text
        ctx.reply("Укажите получателя")
        return ctx.wizard.next()
    },
    ctx => {
        if(ctx.callbackQuery) return
        try {if(ctx.message.text == "/cancel") return cancelAdding(ctx)} catch(err) {}
        ctx.scene.session.state.payment.reciver = ctx.message.text
        ctx.reply("Укажите назначение платежа")
        return ctx.wizard.next()
    },
    ctx => {
        if(ctx.callbackQuery) return
        try {if(ctx.message.text == "/cancel") return cancelAdding(ctx)} catch(err) {}
        ctx.scene.session.state.payment.destenation = ctx.message.text
        ctx.reply("Выберите форму оплаты", {reply_markup: {inline_keyboard: [[{text: "Наличные", callback_data: "cash"}], [{text: "Перевод на карту", callback_data: "card"}]]}})
        return ctx.wizard.next()
    },
    ctx => {
        try {if(ctx.message.text == "/cancel") return cancelAdding(ctx)} catch(err) {}
        if(!ctx.callbackQuery) {
            ctx.reply("Выберите одну из кнопок")
            return ctx.wizard.selectStep(ctx.wizard.cursor - 1)
        }
        if(ctx.callbackQuery.data == "cash") {
            ctx.scene.session.state.payment.cardOrCash = "Наличные"
            ctx.reply("Укажите комментарий", {reply_markup: {inline_keyboard: [[{text: "Без комментария", callback_data: "empty"}]]}})
            return ctx.wizard.selectStep(ctx.wizard.cursor + 2)
        }
        if(ctx.callbackQuery.data == "card") {
            ctx.scene.session.state.payment.cardOrCash = "Перевод на карту"
            ctx.reply("укажите номер карты/телефона")
            return ctx.wizard.next()
        }
    },
    ctx => {
        if(ctx.callbackQuery) return
        try {if(ctx.message.text == "/cancel") return cancelAdding(ctx)} catch(err) {}
        try {ctx.scene.session.state.payment.cardOrPhoneNumber = ctx.message.text} catch(err) {}
        ctx.reply("Укажите комментарий", {reply_markup: {inline_keyboard: [[{text: "Без комментария", callback_data: "empty"}]]}})
        return ctx.wizard.next()
    },
    ctx => {
        console.log(ctx.scene.session.state.payment);
        try {if(ctx.message.text == "/cancel") return cancelAdding(ctx)} catch(err) {}
        if(!ctx.callbackQuery) ctx.scene.session.state.payment.comment = ctx.message.text
        var { id, name, department, date, summ, reciver, destenation, cardOrCash, cardOrPhoneNumber, comment } = ctx.scene.session.state.payment
        var text = `💼 Отдел: ${department}\n👤 Ответственный: ${name}\n📆 Дата: ${date}\n💰 Сумма: ${summ}\n\🟢 Исполнитель: Иванов Ю.А\n\👨‍💼Получатель: ${reciver}\n📌 Назначение: ${destenation}\n🧮 Форма оплаты: ${cardOrCash}${typeof cardOrPhoneNumber != "undefined" ? `\n💳 Номер карты: ${cardOrPhoneNumber}` : ""}${typeof comment != "undefined" ? `\n📝 Комментарий: ${comment}` : ""}`
        const departmentBaseName = department == "Бытовки" ? "bitovki" : "mebel"
        for(var user of getChatIds(departmentBaseName, "usersToSendCash")) try {ctx.telegram.sendMessage(user.chatId, text, {reply_markup: {inline_keyboard: [[{text: "Согласовано", callback_data: "accepetedBy"+id}], [{text: "Не согласовано", callback_data: "deniedBy"+id}]]}}).catch(err => {console.log(err, "cash.js - 74")})} catch(err){console.log(err, "cash.js - 74")} 
        writeNewPaymentToBase(text, departmentBaseName, "Наличные")
        writeNewPaymentToGoogleSheets("Наличные", [id, date, department, name, summ, reciver, destenation, cardOrCash, typeof cardOrPhoneNumber != "undefined" ? cardOrPhoneNumber : "", typeof comment != "undefined" ? comment : ""])
        ctx.reply("Счет отправлен на согласование")
        ctx.scene.leave()
    }
)
const { Scenes } = require("telegraf")
var fs = require("fs")
const { baseFilePath } = require("../values")
const { writeNewPaymentToBase, getChatIds } = require("../functions/baseFunctions")
const { writeNewPaymentToGoogleSheets } = require("../functions/googleSheets")
const { cancelAdding } = require("../functions/repliersFunctions")

module.exports = new Scenes.WizardScene("ipScene", 
    ctx => {
        ctx.scene.session.state.payment = {id: JSON.parse(fs.readFileSync(baseFilePath, "utf-8")).nextId, nick: ctx.from.username, name: ctx.from.first_name, department: ctx.scene.session.state.department}
        console.log(ctx.scene.session.state.payment);
        ctx.reply("Загрузите документ. После загрузки нажмите Продолжить", {reply_markup: {inline_keyboard: [[{text: "Продолжить", callback_data: "continue"}]]}})
        return ctx.wizard.next()
    },
    ctx => {
        console.log(ctx.scene.session.state.payment);
        try {if(ctx.message.text == "/cancel") return cancelAdding(ctx)} catch(err) {}
        try{if(ctx.message.document) ctx.scene.session.state.payment.document = ctx.message.document.file_id} catch(err) {}
        try{if(ctx.message.photo) ctx.scene.session.state.payment.photo = ctx.message.photo.sort(a => -a.file_size)[0].file_id} catch(err) {}
        if(ctx.callbackQuery) {
            if(ctx.callbackQuery.data != "continue") return
            ctx.reply("Укажите дату документа")
            ctx.wizard.next()
        }
    },
    ctx => {
        console.log(ctx.scene.session.state.payment);
        if(ctx.callbackQuery) return
        try {if(ctx.message.text == "/cancel") return cancelAdding(ctx)} catch(err) {}
        ctx.scene.session.state.payment.date = ctx.message.text
        ctx.reply("Укажите номер документа")
        ctx.wizard.next()
    },
    ctx => {
        console.log(ctx.scene.session.state.payment);
        if(ctx.callbackQuery) return
        try {if(ctx.message.text == "/cancel") return cancelAdding(ctx)} catch(err) {}
        ctx.scene.session.state.payment.number = ctx.message.text
        ctx.reply("Укажите сумму")
        ctx.wizard.next()
    },
    ctx => {
        console.log(ctx.scene.session.state.payment);
        if(ctx.callbackQuery) return
        try {if(ctx.message.text == "/cancel") return cancelAdding(ctx)} catch(err) {}
        ctx.scene.session.state.payment.summ = ctx.message.text
        ctx.reply("Укажите наименование контрагента")
        ctx.wizard.next()
    },
    ctx => {
        console.log(ctx.scene.session.state.payment);
        if(ctx.callbackQuery) return
        try {if(ctx.message.text == "/cancel") return cancelAdding(ctx)} catch(err) {}
        ctx.scene.session.state.payment.conteragent = ctx.message.text
        ctx.reply("Укажите назначение платежа")
        ctx.wizard.next()
    },
    ctx => {
        console.log(ctx.scene.session.state.payment);
        if(ctx.callbackQuery) return
        try {if(ctx.message.text == "/cancel") return cancelAdding(ctx)} catch(err) {}
        ctx.scene.session.state.payment.destenation = ctx.message.text
        ctx.reply("Укажите комментарий", {reply_markup: {inline_keyboard: [[{text: "Без комментария", callback_data: "empty"}]]}})
        return ctx.wizard.next()
    },
    ctx => {
        console.log(ctx.scene.session.state.payment);
        try {if(ctx.message.text == "/cancel") return cancelAdding(ctx)} catch(err) {}
        if(!ctx.callbackQuery) ctx.scene.session.state.payment.comment = ctx.message.text
        var { id, name, department, document, photo, date, number, summ, conteragent, destenation, comment } = ctx.scene.session.state.payment
        var ipOrLlc = ctx.scene.session.state.ipOrLlc
        var text = `💼 Отдел: ${department}\n👤 Ответственный: ${name}\n📆 Дата: ${date}\n📃 Номер документа: ${number}\n💰 Сумма: ${summ}\n🟢 Исполнитель: ${ipOrLlc == "ООО" ? "ООО БОН-ГРУПП" : "ИП Иванов Юрий Алексеевич"}\n\👨‍💼Получатель: ${conteragent}\n📌 Назначение: ${destenation}${typeof comment != "undefined" ? `\n📝 Комментарий: ${comment}` : ""}`
        const departmentBaseName = department == "Бытовки" ? "bitovki" : "mebel"
        if(document) for(var user of getChatIds(departmentBaseName, "usersToSendIpOrLlc")) try {ctx.telegram.sendDocument(user.chatId, document, {caption: text, reply_markup: {inline_keyboard: [[{text: "Согласовано", callback_data: "accepetedBy"+id}], [{text: "Не согласовано", callback_data: "deniedBy"+id}]]}}).catch(err => {console.log(err, "ipOrLlc.js - 74")})} catch(err){console.log(err, "ipOrLlc.js - 74")} 
        if(photo) for(var user of getChatIds(departmentBaseName, "usersToSendIpOrLlc")) try {ctx.telegram.sendPhoto(user.chatId, photo, {caption: text, reply_markup: {inline_keyboard: [[{text: "Согласовано", callback_data: "accepetedBy"+id}], [{text: "Не согласовано", callback_data: "deniedBy"+id}]]}}).catch(err => {console.log(err, "ipOrLlc.js - 75")})} catch(err){console.log(err, "ipOrLlc.js - 75")} 
        writeNewPaymentToBase(text, departmentBaseName, ipOrLlc, {document, photo})
        writeNewPaymentToGoogleSheets(ipOrLlc, [id, date, department, number, name, summ, conteragent, destenation, typeof comment != "undefined" ? comment : ""])
        ctx.reply("Счет отправлен на согласование")
        ctx.scene.leave()
    }
)
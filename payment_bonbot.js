const fs = require("fs")
const path = require("path")
require("dotenv").config({path: path.join(__dirname, ".env")})
const { Telegraf, Scenes, session } = require("telegraf")
const bot = new Telegraf(process.env.botToken)

var chatIdsPath = path.join(__dirname, "chatIds.json")

const cashScene = require("./scenes/cash.js")
const ipScene = require("./scenes/ipOrLlc.js")
const editAllUserList = require("./scenes/editAllUserList.js");
const addUserScene = require("./scenes/addUser.js");
const adminToolsScene = require("./scenes/adminTools.js");
const editOtherUserList = require("./scenes/editOtherUserList.js");

const { acceptOrDenieThePayment } = require("./functions/baseFunctions.js");

const stage = new Scenes.Stage([cashScene, ipScene, adminToolsScene, editAllUserList, addUserScene, editOtherUserList])

bot.use(session())
bot.use(stage.middleware())

bot.start(async ctx => {
    ctx.reply("Выберите отдел", {reply_markup: {inline_keyboard: [[{text: "Мебель и текстиль", callback_data: "Мебель и текстиль"}], [{text: "Бытовки", callback_data: "Бытовки"}]]}})
})

bot.action(/Мебель и текстиль|Бытовки/, ctx => {
    const department = ctx.match.input == "Мебель и текстиль" ? 1 : 2
    ctx.reply("Добрый день, выберите способ оплаты", {reply_markup: {inline_keyboard: [[{text: "Оплата наличными", callback_data: "cash." + department}], [{text: "Оплата через ООО", callback_data: "llc." + department}], [{text: "Оплата через ИП", callback_data: "ip." + department}]]}})
})

bot.action(/cash/, ctx => {
    ctx.scene.enter("cashScene", {department: ctx.callbackQuery.data.split(".")[1] == "1" ? "Мебель и текстиль" : "Бытовки"})
})

bot.action(/llc/, ctx => {
    ctx.scene.enter("ipScene", {ipOrLlc: "ООО", department: ctx.callbackQuery.data.split(".")[1] == "1" ? "Мебель и текстиль" : "Бытовки"})
})

bot.action(/ip/, ctx => {
    ctx.scene.enter("ipScene", {ipOrLlc: "ИП", department: ctx.callbackQuery.data.split(".")[1] == "1" ? "Мебель и текстиль" : "Бытовки"})
})

bot.action(/(accepetedBy|deniedBy)(\d+)/ig, ctx => {
    ctx.reply(acceptOrDenieThePayment(ctx.match[1], ctx.match[2], ctx))
})

bot.command("admin_tools", ctx => {
    var allUsers = JSON.parse(fs.readFileSync(chatIdsPath, "utf-8")).allUsers
    if(allUsers.find(user => user.chatId == ctx.from.id)) return ctx.scene.enter("adminToolsScene")
    return ctx.reply("У вас нет доступа к этой команде")
})

bot.command("get_id", ctx => ctx.reply(String(ctx.message.chat.id)))

bot.launch()
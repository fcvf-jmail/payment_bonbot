const { Scenes } = require("telegraf")
const path = require("path")
var fs = require("fs")
var chatIdsPath = path.join(__dirname, "..", "chatIds.json")

var editOtherUserList = new Scenes.BaseScene("editOtherUserList")

function enterScene(ctx) {
    ctx.scene.session.state.nameOfList = ctx.scene.session.state.listToEdit == "usersToSendCash" ? "Наличные" : "ООО/ИП"
    ctx.scene.session.state.nameOfDepartment = ctx.scene.session.state.departmentToEdit == "mebel" ? "Мебель и текстиль" : "Бытовки"
    ctx.reply(`Что вы хотите сделать со списком "${ctx.scene.session.state.nameOfList}" в отделе ${ctx.scene.session.state.nameOfDepartment}`, {reply_markup: {inline_keyboard: [[{text: "Добавить сотрудника", callback_data: "add"}], [{text: "Удалить сотрудника", callback_data: "delete"}], [{text: "Назад", callback_data: "backToAdminTools"}]]}})
}

editOtherUserList.enter(ctx => enterScene(ctx))

editOtherUserList.action("backToAdminTools", ctx => ctx.scene.enter("adminToolsScene", {departmentToEdit: ctx.scene.session.state.departmentToEdit}))
editOtherUserList.action("backToListSellection", ctx => enterScene(ctx))

editOtherUserList.action("delete", async ctx => {
    var departmentToEdit = ctx.scene.session.state.departmentToEdit
    var listToEdit = ctx.scene.session.state.listToEdit
    var data = JSON.parse(fs.readFileSync(chatIdsPath, "utf-8"))[departmentToEdit][listToEdit]
    var inline_keyboard = []
    var backButton = [{text: "Назад", callback_data: "backToListSellection"}]
    if(data.length == 0) return await ctx.reply(`Чтобы кого-то удалить, надо сначала кого-то добавить, пока, что список "${ctx.scene.session.state.nameOfList}" в отделе ${ctx.scene.session.state.nameOfDepartment} пуст`, {reply_markup: {inline_keyboard: [backButton]}})
    for(var user of data) inline_keyboard.push([{text: user.name, callback_data: "remove" + user.chatId}])
    inline_keyboard.push(backButton)
    await ctx.reply("Кого удаляем?", {reply_markup: {inline_keyboard}})
})

editOtherUserList.action(/remove/ig, ctx => {
    var data = JSON.parse(fs.readFileSync(chatIdsPath, "utf-8"))
    var departmentToEdit = ctx.scene.session.state.departmentToEdit
    var listToEdit = ctx.scene.session.state.listToEdit
    data[departmentToEdit][listToEdit] = data[departmentToEdit][listToEdit].filter(user => user.chatId != ctx.match.input.split("remove")[1])
    fs.writeFileSync(chatIdsPath, JSON.stringify(data, null, 4), "utf-8")
    ctx.reply("Сотрудник удален", {reply_markup: {inline_keyboard: [[{text: "Назад", callback_data: "backToListSellection"}]]}})
})

editOtherUserList.action("add", async ctx => {
    var usersToAdd = getUsersToAdd(ctx.scene.session.state.departmentToEdit, ctx.scene.session.state.listToEdit)
    var data = JSON.parse(fs.readFileSync(chatIdsPath, "utf-8"))
    var departmentToEdit = ctx.scene.session.state.departmentToEdit
    var listToEdit = ctx.scene.session.state.listToEdit
    var backButton = [{text: "Назад", callback_data: "backToListSellection"}]
    if(usersToAdd.length == 0 && data[departmentToEdit][listToEdit].length == 0) return await ctx.reply("Список сотрудников пуст", {reply_markup: {inline_keyboard: [backButton]}})
    if(data[departmentToEdit][listToEdit].length == data.allUsers.length) return await ctx.reply(`Список "${ctx.scene.session.state.nameOfList}" в отделе ${ctx.scene.session.state.nameOfDepartment} полностью совпадает со списком сотрудников, некого добавлять`, {reply_markup: {inline_keyboard: [backButton]}})
    var inline_keyboard = []
    for(var user of usersToAdd) inline_keyboard.push([{text: user.name, callback_data: "adduser" + user.chatId}])
    inline_keyboard.push(backButton)
    await ctx.reply("Кого добавить?", {reply_markup: {inline_keyboard}})
})

editOtherUserList.action(/adduser/ig, ctx => {
    var data = JSON.parse(fs.readFileSync(chatIdsPath, "utf-8"))
    var departmentToEdit = ctx.scene.session.state.departmentToEdit
    var listToEdit = ctx.scene.session.state.listToEdit
    var userToAdd = data.allUsers.find(user => user.chatId == ctx.match.input.split("adduser")[1])
    data[departmentToEdit][listToEdit].push(userToAdd)
    fs.writeFileSync(chatIdsPath, JSON.stringify(data, null, 4), "utf-8")
    ctx.reply(`${userToAdd.name} добавлен в список "${ctx.scene.session.state.nameOfList}" в отделе ${ctx.scene.session.state.nameOfDepartment}`, {reply_markup: {inline_keyboard: [[{text: "Назад", callback_data: "backToListSellection"}]]}})
})

function getUsersToAdd(departmentToAdd, listToAdd) {
    var data = JSON.parse(fs.readFileSync(chatIdsPath, "utf-8"))
    return data.allUsers.filter(function(element) {
        return !data[departmentToAdd][listToAdd].some(function(el) {
            return el.chatId === element.chatId;
        });
    })
}

module.exports = editOtherUserList
const { Scenes } = require("telegraf")
const path = require("path")
var fs = require("fs")
var chatIdsPath = path.join(__dirname, "..", "chatIds.json")

module.exports = new Scenes.WizardScene("addUserScene",
    ctx => {
        ctx.reply("Введите имя сотрудника")
        return ctx.wizard.next()
    },
    ctx => {
        try {if(ctx.message.text == "/cancel") return cancelAdding(ctx)} catch(err) {}
        if(ctx.callbackQuery) return
        var name = ctx.message.text
        var user = checkUnick("name", name)
        if(typeof user == "object") return ctx.reply(`Данное имя уже занято сотрудником с чат айди ${user.chatId}`)
        ctx.scene.session.state.name = name
        ctx.reply("Отлично, теперь чат айди этого сотрудника\nP.S, для того чтобы узнать чат айди сотрудник, попросите его написать в этого бота команду /getId")
        return ctx.wizard.next()
    },
    async ctx => {
        try {if(ctx.message.text == "/cancel") return cancelAdding(ctx)} catch(err) {}
        if(ctx.callbackQuery) return
        var chatId = ctx.message.text
        if(Number(chatId).toString() == "NaN") return ctx.reply("Чат айди должен содержать только цифры. Попробуйте снова или напишите /cancel для отмены")
        var user = checkUnick("chatId", chatId)
        if(typeof user == "object") return ctx.reply(`Данный чат айди уже добавлен для сотрудника с именем ${user.name}`)
        addUser(ctx.scene.session.state.name, chatId)
        await ctx.reply(`Добавил нового пользователя с именем ${ctx.scene.session.state.name} и чат айди ${chatId}\nВозвращаю в главное меню`)
        await new Promise(resolve => setTimeout(resolve, 1000))
        return await ctx.scene.enter(ctx.scene.session.state.sceneToGoBack, {listToEdit: ctx.scene.session.state.listToEdit})
    }
)

function checkUnick(key, value) {
    var allUsers = JSON.parse(fs.readFileSync(chatIdsPath, "utf-8")).allUsers
    var userToFind = allUsers.find(user => user[key] == value)
    if(userToFind) return userToFind
    return true
}

function addUser(name, chatId) {
    var data = JSON.parse(fs.readFileSync(chatIdsPath, "utf-8"))
    data.allUsers.push({name, chatId})
    fs.writeFileSync(chatIdsPath, JSON.stringify(data, null, 4), "utf-8")
}

async function cancelAdding(ctx) {
    await ctx.reply("Добавление нового сотрудника отменено, возвращаю в главное меню")
    await ctx.scene.leave()
    await new Promise(resolve => setTimeout(resolve, 1000))
    await ctx.scene.enter("editAllUserList")
}
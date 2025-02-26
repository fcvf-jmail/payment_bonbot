const { Scenes } = require("telegraf")
var adminToolsScene = new Scenes.BaseScene("adminToolsScene")

function enterScene(ctx) {
    ctx.scene.session.state = {}
    ctx.reply("Вот все инструменты, доступные администраторам", {reply_markup: {inline_keyboard: [[{text: "Изменить список сотрудников", callback_data: "changeWorkersList"}], [{text: `Редактировать отдел "Мебель и текстиль"`, callback_data: "changeMebelList"}], [{text: `Редактировать отдел "Бытовки"`, callback_data: "changeBitovkiList"}]]}})
}

function listChoosing(ctx, departmentToEdit) {
    ctx.reply("Какой список будем менять?", {reply_markup: {inline_keyboard: [[{text: "Наличные", callback_data: `changeCashList.${departmentToEdit}`}], [{text: "ООО/ИП", callback_data: `changeIpOrLlcList.${departmentToEdit}`}], [{text: "Назад", callback_data: "toDepartmentChoosing"}]]}})
}

adminToolsScene.action("toDepartmentChoosing", ctx => enterScene(ctx))

adminToolsScene.enter(ctx => {
    if(ctx.scene.session.state.departmentToEdit) return listChoosing(ctx, ctx.scene.session.state.departmentToEdit)
    enterScene(ctx)
})

adminToolsScene.action("changeWorkersList", ctx => ctx.scene.enter("editAllUserList"))

adminToolsScene.action(/changeMebelList|changeBitovkiList/ig, ctx => {
    listChoosing(ctx, ctx.match.input.replace("change", "").replace("List", ""))
})


adminToolsScene.action(/changeCashList|changeIpOrLlcList/ig, ctx => {
    var [ listToEdit, departmentToEdit ] = ctx.match.input.split(".")
    departmentToEdit = departmentToEdit.toLowerCase()
    listToEdit = "usersToSend" + listToEdit.replace("change", "").replace("List", "")
    ctx.scene.enter("editOtherUserList", {listToEdit, departmentToEdit})
})

module.exports = adminToolsScene
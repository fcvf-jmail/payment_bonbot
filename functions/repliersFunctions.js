function cancelAdding(ctx) {
    ctx.reply("Счет отменен")
    ctx.scene.session.state.payment = {}
    ctx.scene.leave()
}

module.exports = { cancelAdding }
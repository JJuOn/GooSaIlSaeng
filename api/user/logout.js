exports.Logout = (req, res) => {
    if (!req.session.user) {
        res.redirect('/')
    } else {
        req.session.destroy (() => {
            res.redirect('/')
        })
    }
}
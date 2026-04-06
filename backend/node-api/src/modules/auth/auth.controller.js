const service = require("./auth.service");

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password required"
            });
        }

        const result = await service.login(email, password);

        req.session.user = result.user;

        res.json({
            success: true,
            ...result
        });

    } catch (err) {
        res.status(401).json({
            success: false,
            error: err.message
        });
    }
};
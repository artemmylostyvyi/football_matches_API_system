const authService = require('../services/authService');

// http request to service register logic
const register = async (req, res) => {
  try {
    // destructirize body of http request
    const { email, password, role } = req.body;

    // Checking required fields
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email та пароль є обов\'язковими полями',
      });
    }

    // Call service function
    const newUser = await authService.register(email, password, role);

    return res.status(201).json({
      status: 'success',
      message: 'Користувача успішно зареєстровано',
      data: { user: newUser },
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      status: 'error',
      message: error.message || 'Внутрішня помилка сервера',
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

     // Checking required fields
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email та пароль є обов\'язковими полями',
      });
    }

    const result = await authService.login(email, password);

    return res.status(200).json({
      status: 'success',
      message: 'Успішний вхід у систему',
      data: result,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      status: 'error',
      message: error.message || 'Внутрішня помилка сервера',
    });
  }
};

module.exports = {
  register,
  login,
};
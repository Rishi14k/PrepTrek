export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const dataToValidate = source === 'query' ? req.query : req.body;
      const parsed = schema.parse(dataToValidate);
      if (source === 'query') {
        req.query = parsed;
      } else {
        req.body = parsed;
      }
      next();
    } catch (error) {
      if (error.errors) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return res.status(400).json({
          success: false,
          message: 'Validation failed. Please correct the highlighted errors.',
          errors: formattedErrors,
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid request payload.',
      });
    }
  };
};

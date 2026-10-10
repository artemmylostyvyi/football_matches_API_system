const ApplicationService = require('../services/applicationService');

class ApplicationController {
  static async create(req, res) {
    try {
      const { tournament_id, team_id } = req.body;

      const newApplication = await ApplicationService.createApplication({
        tournament_id,
        team_id,
      });

      return res.status(201).json({
        status: 'success',
        data: newApplication,
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error.message,
      });
    }
  }

  static async getAll(req, res) {
    try {
      const applications = await ApplicationService.getAllApplications();

      return res.status(200).json({
        status: 'success',
        results: applications.length,
        data: applications,
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  }

  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updatedApplication = await ApplicationService.updateApplicationStatus(id, status);

      return res.status(200).json({
        status: 'success',
        data: updatedApplication,
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error.message,
      });
    }
  }
}

module.exports = ApplicationController;
class ApplicationService {
  constructor(applicationRepository) {
    this.applicationRepository = applicationRepository;
  }


  apply(volunteer, opportunity) {}
  cancel(application) {}
  updateStatus(application, newStatus) {}
}
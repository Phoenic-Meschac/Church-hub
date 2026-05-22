from django.urls import path

from .views import ChurchProfileView, DashboardView

urlpatterns = [
    path("dashboard/stats/", DashboardView.as_view(), name="dashboard-stats"),
    path("church-profile/", ChurchProfileView.as_view(), name="church-profile"),
]

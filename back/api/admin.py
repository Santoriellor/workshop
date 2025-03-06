from django.contrib import admin
from .models import Report, Owner, Vehicle, User, UserProfile, Task, TaskTemplate, Part, Inventory, Invoice

admin.site.register(User)
admin.site.register(UserProfile)
admin.site.register(Report)
admin.site.register(Owner)
admin.site.register(Vehicle)
admin.site.register(Task)
admin.site.register(TaskTemplate)
admin.site.register(Part)
admin.site.register(Inventory)
admin.site.register(Invoice)

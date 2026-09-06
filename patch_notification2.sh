#!/bin/bash
sed -i -e '96,102c\
      const isMine = currentUser && (\
        b.username?.toLowerCase() === currentUser.username.toLowerCase() ||\
        b.requesterName.trim().toLowerCase() === currentUser.name.trim().toLowerCase() ||\
        (currentUser.email && b.email && b.email.toLowerCase() === currentUser.email.toLowerCase())\
      );\
      const isAdmin = currentUser && (currentUser.role === "admin" || currentUser.role === "manager");\
\
      // Skip irrelevant bookings for non-admin\
      if (!isAdmin && !isMine) return;\
' src/components/NotificationCenterModal.tsx

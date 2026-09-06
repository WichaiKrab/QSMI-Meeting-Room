#!/bin/bash
cat << 'INNER_EOF' > /tmp/replacement3.txt
  // Auto-call parent update when unread count changes
  useEffect(() => {
    if (onUnreadCountChange) {
      onUnreadCountChange(unreadCount);
    }
  }, [unreadCount, onUnreadCountChange]);

  const handleMarkAllAsRead = () => {
    const allIds = new Set(notifications.map((n) => n.id));
    setReadIds(allIds);
  };

  const handleItemClick = (n: AppNotification) => {
    setReadIds((prev) => new Set([...prev, n.id]));
    if (n.bookingId) {
      onOpenBooking(n.bookingId);
      onClose();
    } else if (n.type === 'user_pending' && onOpenManagement) {
      onOpenManagement();
      onClose();
    }
  };
INNER_EOF

# Replace lines 193 to 210 with the content of replacement3.txt
sed -i '193,215c\
  // Auto-call parent update when unread count changes\
  useEffect(() => {\
    if (onUnreadCountChange) {\
      onUnreadCountChange(unreadCount);\
    }\
  }, [unreadCount, onUnreadCountChange]);\
\
  const handleMarkAllAsRead = () => {\
    const allIds = new Set(notifications.map((n) => n.id));\
    setReadIds(allIds);\
  };\
\
  const handleItemClick = (n: AppNotification) => {\
    setReadIds((prev) => new Set([...prev, n.id]));\
    if (n.bookingId) {\
      onOpenBooking(n.bookingId);\
      onClose();\
    } else if (n.type === "user_pending" && onOpenManagement) {\
      onOpenManagement();\
      onClose();\
    }\
  };' src/components/NotificationCenterModal.tsx

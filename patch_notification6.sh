#!/bin/bash
cat << 'INNER_EOF' > /tmp/replacement2.txt
interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  bookings: Booking[];
  users: UserAccount[];
  emailNotifications: EmailNotification[];
  onOpenBooking: (bookingId: string) => void;
  onClearEmailNotifications: () => void;
  onOpenManagement?: () => void;
  onUnreadCountChange?: (count: number) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  bookings,
  users,
  emailNotifications,
  onOpenBooking,
  onClearEmailNotifications,
  onOpenManagement,
  onUnreadCountChange
}) => {
INNER_EOF

# Replace lines 38 to 60 with the content of replacement.txt
sed -i '38,60c\
interface NotificationCenterModalProps {\
  isOpen: boolean;\
  onClose: () => void;\
  currentUser: UserAccount | null;\
  bookings: Booking[];\
  users: UserAccount[];\
  emailNotifications: EmailNotification[];\
  onOpenBooking: (bookingId: string) => void;\
  onClearEmailNotifications: () => void;\
  onOpenManagement?: () => void;\
  onUnreadCountChange?: (count: number) => void;\
}\
\
export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({\
  isOpen,\
  onClose,\
  currentUser,\
  bookings,\
  users,\
  emailNotifications,\
  onOpenBooking,\
  onClearEmailNotifications,\
  onOpenManagement,\
  onUnreadCountChange\
}) => {' src/components/NotificationCenterModal.tsx

#!/bin/bash
sed -i 's/  onOpenManagement/  onOpenManagement?: () => void;\n  onUnreadCountChange?: (count: number) => void;/g' src/components/NotificationCenterModal.tsx

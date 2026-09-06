#!/bin/bash
# Remove activeTab emails
sed -i "s/useState<'all' | 'bookings' | 'emails' | 'system'>/useState<'all' | 'bookings' | 'system'>/" src/components/NotificationCenterModal.tsx
# Remove email filter
sed -i "/if (activeTab === 'emails' && n.type !== 'email') return false;/d" src/components/NotificationCenterModal.tsx
sed -i "s/if (activeTab === 'system' && (n.type.startsWith('booking_') || n.type === 'email')) return false;/if (activeTab === 'system' \&\& n.type.startsWith('booking_')) return false;/" src/components/NotificationCenterModal.tsx

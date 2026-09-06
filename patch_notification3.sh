#!/bin/bash
sed -i -e '/<button/,/<\/button>/!b' -e '/setActiveTab('\''emails'\'')/!b' -e '/<button/,/<\/button>/d' src/components/NotificationCenterModal.tsx

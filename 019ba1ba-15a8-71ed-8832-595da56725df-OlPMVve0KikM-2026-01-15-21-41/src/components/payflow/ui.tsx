import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '@/lib/cn';
import {
  Building2,
  Users,
  Euro,
  AlertCircle,
  TrendingUp,
  ChevronRight,
} from 'lucide-react-native';

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  trendPositive?: boolean;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
}

const variantColors = {
  primary: ['#6366f1', '#8b5cf6'] as const,
  success: ['#10b981', '#059669'] as const,
  warning: ['#f59e0b', '#d97706'] as const,
  danger: ['#ef4444', '#dc2626'] as const,
};

export function StatCard({
  icon,
  label,
  value,
  trend,
  trendPositive,
  variant = 'primary',
}: StatCardProps) {
  return (
    <View className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
      <View className="flex-row items-start gap-3">
        <LinearGradient
          colors={variantColors[variant]}
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </LinearGradient>
        <View className="flex-1">
          <Text className="text-xs text-slate-500 font-medium mb-0.5">
            {label}
          </Text>
          <Text className="text-2xl font-bold text-slate-900">{value}</Text>
          {trend && (
            <Text
              className={cn(
                'text-xs mt-0.5',
                trendPositive ? 'text-emerald-600' : 'text-slate-500'
              )}
            >
              {trend}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

// Action Card Component
interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
}

export function ActionCard({ icon, title, onPress }: ActionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex-row items-center gap-3 active:bg-slate-100"
    >
      <View className="text-indigo-500">{icon}</View>
      <Text className="flex-1 font-semibold text-slate-900">{title}</Text>
      <ChevronRight size={18} color="#94a3b8" />
    </Pressable>
  );
}

// Employee Item Component
interface EmployeeItemProps {
  name: string;
  position: string;
  initials: string;
  onPress?: () => void;
  actionLabel?: string;
}

export function EmployeeItem({
  name,
  position,
  initials,
  onPress,
  actionLabel = 'Saisir',
}: EmployeeItemProps) {
  return (
    <View className="bg-slate-50 rounded-xl p-4 flex-row items-center justify-between">
      <View className="flex-row items-center gap-3">
        <LinearGradient
          colors={['#6366f1', '#8b5cf6']}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text className="text-white font-semibold text-sm">{initials}</Text>
        </LinearGradient>
        <View>
          <Text className="font-semibold text-slate-900">{name}</Text>
          <Text className="text-sm text-slate-500">{position}</Text>
        </View>
      </View>
      {onPress && (
        <Pressable
          onPress={onPress}
          className="bg-white border border-slate-200 rounded-lg px-3 py-2 active:bg-slate-100"
        >
          <Text className="text-sm font-medium text-slate-700">
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// Timeline Item Component
interface TimelineItemProps {
  title: string;
  date: string;
  status: 'completed' | 'current' | 'pending';
  isLast?: boolean;
}

export function TimelineItem({
  title,
  date,
  status,
  isLast = false,
}: TimelineItemProps) {
  const markerColor =
    status === 'completed'
      ? '#10b981'
      : status === 'current'
        ? '#6366f1'
        : '#e2e8f0';

  return (
    <View className="flex-row gap-4">
      <View className="items-center">
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: markerColor,
            borderWidth: status === 'current' ? 4 : 0,
            borderColor: 'rgba(99, 102, 241, 0.2)',
          }}
        />
        {!isLast && (
          <View
            style={{
              width: 2,
              flex: 1,
              backgroundColor: '#e2e8f0',
              marginVertical: 4,
            }}
          />
        )}
      </View>
      <View className="flex-1 pb-6">
        <Text className="font-semibold text-slate-900">{title}</Text>
        <Text className="text-sm text-slate-500">{date}</Text>
      </View>
    </View>
  );
}

// Badge Component
interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'neutral';
}

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const variantClasses = {
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-800',
    neutral: 'bg-slate-100 text-slate-700',
  };

  return (
    <View className={cn('px-2.5 py-1 rounded-md', variantClasses[variant])}>
      <Text
        className={cn(
          'text-xs font-semibold',
          variant === 'success' && 'text-emerald-800',
          variant === 'warning' && 'text-amber-800',
          variant === 'danger' && 'text-red-800',
          variant === 'neutral' && 'text-slate-700'
        )}
      >
        {label}
      </Text>
    </View>
  );
}

// Section Header Component
interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: SectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between mb-4">
      <Text className="text-lg font-bold text-slate-900">{title}</Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction}>
          <Text className="text-sm font-semibold text-indigo-600">
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// Bulletin Item Component
interface BulletinItemProps {
  title: string;
  subtitle: string;
  status: 'sent' | 'pending';
  onView?: () => void;
  onDownload?: () => void;
}

export function BulletinItem({
  title,
  subtitle,
  status,
  onView,
  onDownload,
}: BulletinItemProps) {
  return (
    <View className="bg-slate-50 rounded-xl p-4 flex-row items-center gap-3">
      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        style={{
          width: 48,
          height: 48,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Euro size={24} color="white" />
      </LinearGradient>
      <View className="flex-1">
        <Text className="font-semibold text-slate-900">{title}</Text>
        <View className="flex-row items-center gap-2 mt-0.5">
          <Text className="text-sm text-slate-500">{subtitle}</Text>
          <Badge
            label={status === 'sent' ? 'Envoyé' : 'En attente'}
            variant={status === 'sent' ? 'success' : 'warning'}
          />
        </View>
      </View>
      <View className="flex-row gap-1">
        {onView && (
          <Pressable
            onPress={onView}
            className="p-2 rounded-lg active:bg-slate-200"
          >
            <TrendingUp size={18} color="#64748b" />
          </Pressable>
        )}
        {onDownload && (
          <Pressable
            onPress={onDownload}
            className="p-2 rounded-lg active:bg-slate-200"
          >
            <ChevronRight size={18} color="#64748b" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

// Export Icons for convenience
export const Icons = {
  Building2,
  Users,
  Euro,
  AlertCircle,
  TrendingUp,
  ChevronRight,
};

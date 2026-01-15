import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, Share, Platform, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  User,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  Euro,
  FileText,
  Download,
  Eye,
  CreditCard,
  Heart,
  IdCard,
  Home,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Check,
  Share2,
  Trash2,
  AlertTriangle,
  History,
} from 'lucide-react-native';
import { useEmployees, usePayslips, useDeleteEmployee } from '@/lib/hooks/usePayflow';
import { useUserType } from '@/lib/state/app-store';
import { Badge } from '@/components/payflow/ui';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { EmployeeWithDetails } from '@/lib/database.types';

interface EmployeeDocument {
  id: string;
  name: string;
  type: string;
  icon: React.ReactNode;
  status: 'uploaded' | 'missing';
  uploadDate?: string;
  fileName?: string;
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View className="flex-row items-center py-3 border-b border-slate-100">
      <View className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center mr-3">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-xs text-slate-400">{label}</Text>
        <Text className="text-base font-medium text-slate-900">{value}</Text>
      </View>
    </View>
  );
}

function DocumentCard({
  document,
  onView,
  onDownload,
}: {
  document: EmployeeDocument;
  onView: () => void;
  onDownload: () => void;
}) {
  const isUploaded = document.status === 'uploaded';

  return (
    <View className="bg-white rounded-xl p-4 border border-slate-100 mb-3">
      <View className="flex-row items-center">
        <View
          className={`w-12 h-12 rounded-xl items-center justify-center mr-3 ${
            isUploaded ? 'bg-emerald-100' : 'bg-slate-100'
          }`}
        >
          {document.icon}
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-slate-900">{document.name}</Text>
          {isUploaded ? (
            <View className="flex-row items-center gap-2 mt-0.5">
              <Check size={12} color="#10b981" />
              <Text className="text-xs text-emerald-600">
                {document.fileName ?? 'Document uploadé'}
              </Text>
            </View>
          ) : (
            <Text className="text-xs text-slate-400">Non renseigné</Text>
          )}
          {document.uploadDate && (
            <Text className="text-xs text-slate-400 mt-0.5">
              Ajouté le {document.uploadDate}
            </Text>
          )}
        </View>
        {isUploaded && (
          <Badge label="Valide" variant="success" />
        )}
      </View>
      {isUploaded && (
        <View className="flex-row gap-2 mt-3 pt-3 border-t border-slate-100">
          <Pressable
            onPress={onView}
            className="flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-50 active:bg-slate-100"
          >
            <Eye size={16} color="#64748b" />
            <Text className="text-sm font-medium text-slate-600">Voir</Text>
          </Pressable>
          <Pressable
            onPress={onDownload}
            className="flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-500 active:bg-indigo-600"
          >
            <Download size={16} color="white" />
            <Text className="text-sm font-medium text-white">Télécharger</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function PayslipHistoryItem({
  month,
  year,
  grossSalary,
  netSalary,
  status,
  onView,
}: {
  month: string;
  year: number;
  grossSalary: number;
  netSalary: number;
  status: string;
  onView: () => void;
}) {
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const monthName = monthNames[parseInt(month) - 1];

  return (
    <Pressable
      onPress={onView}
      className="flex-row items-center py-3 border-b border-slate-100 active:bg-slate-50"
    >
      <View className="w-10 h-10 rounded-xl bg-indigo-100 items-center justify-center mr-3">
        <FileText size={18} color="#6366f1" />
      </View>
      <View className="flex-1">
        <Text className="font-medium text-slate-900">{monthName} {year}</Text>
        <Text className="text-xs text-slate-400">Net: {netSalary.toLocaleString()}€</Text>
      </View>
      <ChevronRight size={18} color="#94a3b8" />
    </Pressable>
  );
}

export default function EmployeeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userType = useUserType();
  const { data: employees, isLoading: loadingEmployees } = useEmployees();
  const { data: payslips, isLoading: loadingPayslips } = usePayslips();
  const deleteEmployeeMutation = useDeleteEmployee();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  const employee = employees?.find(e => e.id === id);
  const employeePayslips = payslips?.filter(p => p.employee_id === id)?.slice(0, 5) ?? [];

  const handleDeleteEmployee = async () => {
    if (!employee) return;

    await deleteEmployeeMutation.mutateAsync({
      employee: employee as EmployeeWithDetails,
      reason: deleteReason || undefined,
    });

    setShowDeleteModal(false);
    setDeleteReason('');
    router.back();
  };

  // Mock documents data (in production would come from DB)
  const [documents] = useState<EmployeeDocument[]>([
    {
      id: 'carte_identite',
      name: "Carte d'identité",
      type: 'identity',
      icon: <IdCard size={20} color="#6366f1" />,
      status: 'uploaded',
      fileName: 'carte_identite_recto_verso.pdf',
      uploadDate: '15/01/2024',
    },
    {
      id: 'carte_vitale',
      name: 'Carte vitale',
      type: 'vitale',
      icon: <Heart size={20} color="#ec4899" />,
      status: 'uploaded',
      fileName: 'attestation_carte_vitale.pdf',
      uploadDate: '15/01/2024',
    },
    {
      id: 'rib',
      name: 'RIB bancaire',
      type: 'rib',
      icon: <CreditCard size={20} color="#10b981" />,
      status: 'uploaded',
      fileName: 'rib_banque.pdf',
      uploadDate: '15/01/2024',
    },
    {
      id: 'justificatif_domicile',
      name: 'Justificatif de domicile',
      type: 'address',
      icon: <Home size={20} color="#f59e0b" />,
      status: 'uploaded',
      fileName: 'facture_edf_janvier.pdf',
      uploadDate: '10/01/2024',
    },
    {
      id: 'contrat_travail',
      name: 'Contrat de travail',
      type: 'contract',
      icon: <FileText size={20} color="#8b5cf6" />,
      status: 'uploaded',
      fileName: 'contrat_cdi_signe.pdf',
      uploadDate: '15/03/2023',
    },
  ]);

  const handleViewDocument = (doc: EmployeeDocument) => {
    Alert.alert(
      doc.name,
      `Aperçu du document: ${doc.fileName}`,
      [{ text: 'Fermer', style: 'cancel' }]
    );
  };

  const handleDownloadDocument = async (doc: EmployeeDocument) => {
    try {
      // In production, this would download the actual file
      // For demo, we show a share dialog
      if (Platform.OS === 'web') {
        Alert.alert('Téléchargement', `Le document "${doc.name}" a été téléchargé.`);
      } else {
        await Share.share({
          message: `Document: ${doc.name}\nFichier: ${doc.fileName}`,
          title: doc.name,
        });
      }
    } catch (error) {
      console.error('Erreur téléchargement:', error);
    }
  };

  if (loadingEmployees || loadingPayslips) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className="text-slate-500 mt-3">Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!employee) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-slate-500">Employé non trouvé</Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-4 bg-indigo-500 px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">Retour</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const initials = employee.full_name.split(' ').map(n => n[0]).join('');
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Calculate monthly salary
  const monthlySalary = Number(employee.hourly_rate) * 151.67;
  const estimatedNet = monthlySalary * 0.78;

  const DeleteConfirmationModal = () => (
    <Modal
      visible={showDeleteModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowDeleteModal(false)}
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-5">
        <View className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
          {/* Header */}
          <View className="bg-red-50 p-6 items-center">
            <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-3">
              <AlertTriangle size={32} color="#ef4444" />
            </View>
            <Text className="text-xl font-bold text-slate-900">Supprimer l'employé</Text>
          </View>

          {/* Content */}
          <View className="p-5">
            <Text className="text-slate-600 text-center mb-4">
              Voulez-vous vraiment supprimer {employee.full_name} de la liste des employés ?
            </Text>

            <Text className="text-sm text-slate-500 mb-2">Motif de suppression (optionnel)</Text>
            <TextInput
              value={deleteReason}
              onChangeText={setDeleteReason}
              placeholder="Ex: Fin de contrat, Démission..."
              placeholderTextColor="#94a3b8"
              className="bg-slate-100 rounded-xl px-4 py-3 text-slate-900 mb-4"
              multiline
            />

            <View className="bg-amber-50 rounded-xl p-3 mb-4 flex-row items-start gap-2">
              <History size={18} color="#f59e0b" />
              <Text className="text-amber-800 text-sm flex-1">
                Cette action est réversible. L'historique sera conservé.
              </Text>
            </View>

            {/* Buttons */}
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeleteReason('');
                }}
                className="flex-1 bg-slate-100 rounded-xl py-3.5 active:bg-slate-200"
              >
                <Text className="text-center font-semibold text-slate-700">Annuler</Text>
              </Pressable>
              <Pressable
                onPress={handleDeleteEmployee}
                disabled={deleteEmployeeMutation.isPending}
                className="flex-1 bg-red-500 rounded-xl py-3.5 active:bg-red-600"
              >
                <Text className="text-center font-semibold text-white">
                  {deleteEmployeeMutation.isPending ? 'Suppression...' : 'Supprimer'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <DeleteConfirmationModal />
      {/* Header */}
      <View className="px-5 pt-2 pb-4 flex-row items-center border-b border-slate-200 bg-white">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center mr-3 active:bg-slate-200"
        >
          <ArrowLeft size={20} color="#64748b" />
        </Pressable>
        <Text className="text-xl font-bold text-slate-900 flex-1">Fiche employé</Text>
        {userType === 'societe_a' && (
          <Pressable
            onPress={() => setShowDeleteModal(true)}
            className="w-10 h-10 rounded-full bg-red-50 items-center justify-center active:bg-red-100"
          >
            <Trash2 size={20} color="#ef4444" />
          </Pressable>
        )}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View className="bg-white px-5 pt-6 pb-6 border-b border-slate-100">
          <View className="items-center">
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text className="text-white font-bold text-2xl">{initials}</Text>
            </LinearGradient>
            <Text className="text-2xl font-bold text-slate-900 mt-3">{employee.full_name}</Text>
            <Text className="text-slate-500 mt-1">{employee.position}</Text>
            <View className="flex-row items-center gap-2 mt-2">
              <Badge label={employee.contract_type} variant="neutral" />
              <Badge label="Actif" variant="success" />
            </View>
          </View>
        </View>

        <View className="px-5 py-6">
          {/* Informations Personnelles */}
          <View className="bg-white rounded-2xl p-4 mb-4 border border-slate-100">
            <Text className="text-lg font-bold text-slate-900 mb-2">Informations personnelles</Text>
            <InfoRow
              icon={<User size={18} color="#6366f1" />}
              label="Nom complet"
              value={employee.full_name}
            />
            <InfoRow
              icon={<Mail size={18} color="#6366f1" />}
              label="Email"
              value={`${employee.full_name.toLowerCase().replace(' ', '.')}@email.com`}
            />
            <InfoRow
              icon={<Phone size={18} color="#6366f1" />}
              label="Téléphone"
              value="06 12 34 56 78"
            />
            <InfoRow
              icon={<MapPin size={18} color="#6366f1" />}
              label="Adresse"
              value="15 rue de la Paix, 75001 Paris"
            />
          </View>

          {/* Informations Contrat */}
          <View className="bg-white rounded-2xl p-4 mb-4 border border-slate-100">
            <Text className="text-lg font-bold text-slate-900 mb-2">Contrat de travail</Text>
            <InfoRow
              icon={<Briefcase size={18} color="#6366f1" />}
              label="Poste"
              value={employee.position}
            />
            <InfoRow
              icon={<FileText size={18} color="#6366f1" />}
              label="Type de contrat"
              value={employee.contract_type}
            />
            <InfoRow
              icon={<Calendar size={18} color="#6366f1" />}
              label="Date d'embauche"
              value={formatDate(employee.hire_date)}
            />
            <InfoRow
              icon={<Clock size={18} color="#6366f1" />}
              label="Durée hebdomadaire"
              value="35 heures"
            />
            <InfoRow
              icon={<Euro size={18} color="#6366f1" />}
              label="Taux horaire"
              value={`${Number(employee.hourly_rate).toFixed(2)}€/h`}
            />
            <InfoRow
              icon={<Euro size={18} color="#10b981" />}
              label="Salaire brut mensuel"
              value={`${monthlySalary.toFixed(2)}€`}
            />
            <View className="flex-row items-center py-3">
              <View className="w-10 h-10 rounded-xl bg-emerald-100 items-center justify-center mr-3">
                <Euro size={18} color="#10b981" />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-slate-400">Salaire net estimé</Text>
                <Text className="text-base font-bold text-emerald-600">{estimatedNet.toFixed(2)}€</Text>
              </View>
            </View>
          </View>

          {/* Entreprises */}
          <View className="bg-white rounded-2xl p-4 mb-4 border border-slate-100">
            <Text className="text-lg font-bold text-slate-900 mb-2">Entreprises</Text>
            <InfoRow
              icon={<Building2 size={18} color="#6366f1" />}
              label="Employeur (Société A)"
              value={employee.employer_company?.name ?? 'N/A'}
            />
            <View className="flex-row items-center py-3">
              <View className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center mr-3">
                <Building2 size={18} color="#f59e0b" />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-slate-400">Client (Société B)</Text>
                <Text className="text-base font-medium text-slate-900">
                  {employee.client_company?.name ?? 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          {/* Documents */}
          <View className="mb-4">
            <Text className="text-lg font-bold text-slate-900 mb-3">Documents</Text>
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onView={() => handleViewDocument(doc)}
                onDownload={() => handleDownloadDocument(doc)}
              />
            ))}
          </View>

          {/* Historique Bulletins (only for societe_a) */}
          {userType === 'societe_a' && employeePayslips.length > 0 && (
            <View className="bg-white rounded-2xl p-4 mb-4 border border-slate-100">
              <Text className="text-lg font-bold text-slate-900 mb-2">Derniers bulletins</Text>
              {employeePayslips.map((payslip) => (
                <PayslipHistoryItem
                  key={payslip.id}
                  month={payslip.month}
                  year={payslip.year}
                  grossSalary={Number(payslip.gross_salary)}
                  netSalary={Number(payslip.net_salary)}
                  status={payslip.status}
                  onView={() => router.push(`/payslip-viewer?id=${payslip.id}`)}
                />
              ))}
            </View>
          )}

          {/* Actions */}
          {userType === 'societe_a' && (
            <View className="gap-3 mb-6">
              <Pressable
                onPress={() => router.push('/variable-entry')}
                className="bg-indigo-500 rounded-xl py-4 flex-row items-center justify-center gap-2 active:bg-indigo-600"
              >
                <Clock size={20} color="white" />
                <Text className="text-white font-semibold">Saisir les variables</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/generate-payslip')}
                className="bg-white rounded-xl py-4 flex-row items-center justify-center gap-2 border border-indigo-200 active:bg-indigo-50"
              >
                <FileText size={20} color="#6366f1" />
                <Text className="text-indigo-600 font-semibold">Générer un bulletin</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

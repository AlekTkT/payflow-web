import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { X, Download, Share2 } from 'lucide-react-native';
import { useInvoices, useEmployees, useCompanies } from '@/lib/hooks/usePayflow';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

function formatNumber(num: number, decimals: number = 2): string {
  return num.toFixed(decimals).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR');
}

function getMonthName(month: string, year: number): string {
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
}

export default function InvoiceViewerScreen() {
  const { id, action } = useLocalSearchParams<{ id: string; action?: string }>();
  const viewRef = useRef<View>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [hasTriggeredShare, setHasTriggeredShare] = useState(false);

  const { data: invoices, isLoading: loadingInvoices } = useInvoices();
  const { data: employees } = useEmployees();
  const { data: companies } = useCompanies();

  const invoice = invoices?.find(i => i.id === id);
  const issuerCompany = companies?.find(c => c.id === invoice?.issuer_company_id);
  const clientCompany = companies?.find(c => c.id === invoice?.client_company_id);
  const invoiceEmployees = employees?.filter(e => e.client_company_id === invoice?.client_company_id) ?? [];

  // Calculate invoice details
  const amount = invoice?.amount ?? 0;
  const tvaRate = 0.20;
  const amountHT = amount / (1 + tvaRate);
  const tvaAmount = amount - amountHT;

  const generateAndSharePdf = async () => {
    if (isGeneratingPdf || !invoice) return;
    setIsGeneratingPdf(true);

    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; font-size: 11px; margin: 30px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .logo { font-size: 24px; font-weight: bold; color: #6366f1; }
            .invoice-title { font-size: 28px; font-weight: bold; color: #1e3a5f; text-align: right; }
            .invoice-number { color: #6366f1; font-size: 14px; }
            .company-info { margin-bottom: 30px; }
            .company-name { font-weight: bold; font-size: 14px; margin-bottom: 5px; }
            .addresses { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .address-box { width: 45%; }
            .address-label { font-size: 10px; color: #64748b; margin-bottom: 5px; text-transform: uppercase; }
            .client-box { background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #6366f1; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #1e3a5f; color: white; padding: 12px 8px; text-align: left; font-size: 10px; text-transform: uppercase; }
            td { padding: 12px 8px; border-bottom: 1px solid #e2e8f0; }
            .amount-col { text-align: right; }
            .totals { margin-top: 20px; margin-left: auto; width: 300px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
            .total-label { color: #64748b; }
            .total-value { font-weight: bold; }
            .grand-total { background: #6366f1; color: white; padding: 15px; border-radius: 8px; margin-top: 10px; }
            .grand-total .total-label, .grand-total .total-value { color: white; font-size: 16px; }
            .payment-info { margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 8px; }
            .payment-title { font-weight: bold; margin-bottom: 10px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; text-align: center; }
            .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: bold; }
            .status-sent { background: #fef3c7; color: #92400e; }
            .status-paid { background: #d1fae5; color: #065f46; }
            .status-overdue { background: #fee2e2; color: #991b1b; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">${issuerCompany?.name ?? 'TalentFlow SAS'}</div>
              <div style="margin-top: 10px; color: #64748b;">
                ${issuerCompany?.address ?? ''}<br>
                ${issuerCompany?.postal_code ?? ''} ${issuerCompany?.city ?? ''}<br>
                SIRET: ${issuerCompany?.siret ?? 'N/A'}<br>
                N° TVA: FR${issuerCompany?.siret?.slice(0, 11) ?? 'XXXXXXXXXXX'}
              </div>
            </div>
            <div style="text-align: right;">
              <div class="invoice-title">FACTURE</div>
              <div class="invoice-number">${invoice.invoice_number}</div>
              <div style="margin-top: 10px; color: #64748b;">
                Date d'émission: ${formatDate(invoice.created_at)}<br>
                Date d'échéance: ${formatDate(invoice.due_date)}
              </div>
              <div style="margin-top: 10px;">
                <span class="status-badge status-${invoice.status}">
                  ${invoice.status === 'paid' ? 'PAYÉE' : invoice.status === 'overdue' ? 'EN RETARD' : 'EN ATTENTE'}
                </span>
              </div>
            </div>
          </div>

          <div class="addresses">
            <div class="address-box">
              <div class="address-label">Émetteur</div>
              <div class="company-name">${issuerCompany?.name ?? 'TalentFlow SAS'}</div>
              <div>${issuerCompany?.address ?? ''}</div>
              <div>${issuerCompany?.postal_code ?? ''} ${issuerCompany?.city ?? ''}</div>
              <div>Tél: ${issuerCompany?.phone ?? 'N/A'}</div>
              <div>Email: ${issuerCompany?.email ?? 'N/A'}</div>
            </div>
            <div class="address-box">
              <div class="address-label">Facturer à</div>
              <div class="client-box">
                <div class="company-name">${clientCompany?.name ?? 'Client'}</div>
                <div>${clientCompany?.address ?? ''}</div>
                <div>${clientCompany?.postal_code ?? ''} ${clientCompany?.city ?? ''}</div>
                <div>SIRET: ${clientCompany?.siret ?? 'N/A'}</div>
              </div>
            </div>
          </div>

          <div style="background: #f1f5f9; padding: 10px 15px; border-radius: 4px; margin-bottom: 20px;">
            <strong>Période:</strong> ${getMonthName(invoice.month, invoice.year)} |
            <strong>Référence:</strong> ${invoice.invoice_number}
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 50%;">Description</th>
                <th style="width: 15%;">Quantité</th>
                <th style="width: 15%;">Prix unitaire</th>
                <th style="width: 20%;" class="amount-col">Montant HT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Prestation de portage salarial</strong><br>
                  <span style="color: #64748b; font-size: 10px;">
                    ${invoiceEmployees.length} salarié(s) porté(s) - ${getMonthName(invoice.month, invoice.year)}
                  </span>
                </td>
                <td>1</td>
                <td>${formatNumber(amountHT)} €</td>
                <td class="amount-col">${formatNumber(amountHT)} €</td>
              </tr>
              ${invoiceEmployees.map(emp => `
              <tr style="background: #fafafa;">
                <td style="padding-left: 30px; color: #64748b;">
                  └ ${emp.full_name} - ${emp.position}
                </td>
                <td>151,67h</td>
                <td>${formatNumber(emp.hourly_rate)} €/h</td>
                <td class="amount-col">${formatNumber(151.67 * emp.hourly_rate)} €</td>
              </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span class="total-label">Total HT</span>
              <span class="total-value">${formatNumber(amountHT)} €</span>
            </div>
            <div class="total-row">
              <span class="total-label">TVA (20%)</span>
              <span class="total-value">${formatNumber(tvaAmount)} €</span>
            </div>
            <div class="grand-total">
              <div class="total-row" style="border: none; padding: 0;">
                <span class="total-label">Total TTC</span>
                <span class="total-value">${formatNumber(amount)} €</span>
              </div>
            </div>
          </div>

          <div class="payment-info">
            <div class="payment-title">Informations de paiement</div>
            <div style="display: flex; gap: 40px;">
              <div>
                <div style="color: #64748b; font-size: 10px;">IBAN</div>
                <div>FR76 XXXX XXXX XXXX XXXX XXXX XXX</div>
              </div>
              <div>
                <div style="color: #64748b; font-size: 10px;">BIC</div>
                <div>BNPAFRPP</div>
              </div>
              <div>
                <div style="color: #64748b; font-size: 10px;">Référence</div>
                <div>${invoice.invoice_number}</div>
              </div>
            </div>
            <div style="margin-top: 15px; padding: 10px; background: #fef3c7; border-radius: 4px; color: #92400e; font-size: 10px;">
              <strong>Conditions de paiement:</strong> Paiement à réception de facture. En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée.
            </div>
          </div>

          <div class="footer">
            ${issuerCompany?.name ?? 'TalentFlow SAS'} - SIRET: ${issuerCompany?.siret ?? 'N/A'} - TVA: FR${issuerCompany?.siret?.slice(0, 11) ?? 'XXXXXXXXXXX'}<br>
            ${issuerCompany?.address ?? ''}, ${issuerCompany?.postal_code ?? ''} ${issuerCompany?.city ?? ''}<br>
            Document généré automatiquement - Conservez ce document pour vos archives
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });

      const filename = `facture_${invoice.invoice_number.replace(/\s/g, '_')}.pdf`;
      const newPath = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.moveAsync({
        from: uri,
        to: newPath,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newPath, {
          mimeType: 'application/pdf',
          dialogTitle: `Facture ${invoice.invoice_number}`,
        });
      } else {
        Alert.alert('Succès', `Facture PDF sauvegardée: ${filename}`);
      }
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      Alert.alert('Erreur', 'Impossible de générer le PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleShare = async () => {
    await generateAndSharePdf();
  };

  // Auto-trigger share if action=share
  useEffect(() => {
    if (action === 'share' && invoice && !hasTriggeredShare && !loadingInvoices) {
      setHasTriggeredShare(true);
      const timer = setTimeout(() => {
        generateAndSharePdf();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [action, invoice, hasTriggeredShare, loadingInvoices]);

  if (loadingInvoices) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-slate-500 mt-3">Chargement de la facture...</Text>
      </SafeAreaView>
    );
  }

  if (!invoice) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-slate-500">Facture introuvable</Text>
        <Pressable onPress={() => router.back()} className="mt-4 px-4 py-2 bg-indigo-500 rounded-lg">
          <Text className="text-white font-medium">Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const statusConfig = {
    draft: { label: 'Brouillon', color: 'bg-slate-100 text-slate-700' },
    sent: { label: 'En attente', color: 'bg-amber-100 text-amber-800' },
    paid: { label: 'Payée', color: 'bg-emerald-100 text-emerald-800' },
    overdue: { label: 'En retard', color: 'bg-red-100 text-red-800' },
  };
  const status = statusConfig[invoice.status] || statusConfig.draft;

  return (
    <SafeAreaView className="flex-1 bg-slate-100" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <X size={24} color="#64748b" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900" numberOfLines={1}>
          {clientCompany?.name ?? 'Facture'} - {getMonthName(invoice.month, invoice.year)}
        </Text>
        <View className="flex-row gap-2">
          <Pressable onPress={handleShare} className="p-2" disabled={isGeneratingPdf}>
            {isGeneratingPdf ? (
              <ActivityIndicator size="small" color="#6366f1" />
            ) : (
              <Share2 size={22} color="#6366f1" />
            )}
          </Pressable>
          <Pressable onPress={generateAndSharePdf} className="p-2" disabled={isGeneratingPdf}>
            <Download size={22} color="#6366f1" />
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4">
          {/* Invoice Document Preview */}
          <View ref={viewRef} collapsable={false} className="bg-white rounded-xl overflow-hidden border border-slate-200">
            {/* Invoice Header */}
            <View className="p-5 border-b border-slate-100">
              <View className="flex-row justify-between items-start">
                <View>
                  <Text className="text-xl font-bold text-indigo-600">{issuerCompany?.name ?? 'TalentFlow SAS'}</Text>
                  <Text className="text-xs text-slate-500 mt-1">{issuerCompany?.address}</Text>
                  <Text className="text-xs text-slate-500">{issuerCompany?.postal_code} {issuerCompany?.city}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-2xl font-bold text-slate-800">FACTURE</Text>
                  <Text className="text-indigo-600 font-medium">{invoice.invoice_number}</Text>
                  <View className={`px-3 py-1 rounded-full mt-2 ${status.color.split(' ')[0]}`}>
                    <Text className={`text-xs font-semibold ${status.color.split(' ')[1]}`}>{status.label}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Dates and Client */}
            <View className="p-5 bg-slate-50 border-b border-slate-100">
              <View className="flex-row justify-between">
                <View>
                  <Text className="text-xs text-slate-500 uppercase mb-1">Date d'émission</Text>
                  <Text className="font-medium text-slate-900">{formatDate(invoice.created_at)}</Text>
                </View>
                <View>
                  <Text className="text-xs text-slate-500 uppercase mb-1">Échéance</Text>
                  <Text className="font-medium text-slate-900">{formatDate(invoice.due_date)}</Text>
                </View>
                <View>
                  <Text className="text-xs text-slate-500 uppercase mb-1">Période</Text>
                  <Text className="font-medium text-slate-900">{getMonthName(invoice.month, invoice.year)}</Text>
                </View>
              </View>
            </View>

            {/* Client Info */}
            <View className="p-5 border-b border-slate-100">
              <Text className="text-xs text-slate-500 uppercase mb-2">Facturer à</Text>
              <View className="bg-indigo-50 rounded-lg p-4 border-l-4 border-indigo-500">
                <Text className="font-bold text-slate-900">{clientCompany?.name}</Text>
                <Text className="text-sm text-slate-600">{clientCompany?.address}</Text>
                <Text className="text-sm text-slate-600">{clientCompany?.postal_code} {clientCompany?.city}</Text>
                <Text className="text-xs text-slate-500 mt-2">SIRET: {clientCompany?.siret ?? 'N/A'}</Text>
              </View>
            </View>

            {/* Line Items */}
            <View className="p-5 border-b border-slate-100">
              <Text className="text-xs text-slate-500 uppercase mb-3">Détails de la prestation</Text>

              <View className="bg-slate-800 rounded-t-lg p-3 flex-row">
                <Text className="flex-[2] text-xs font-semibold text-white">Description</Text>
                <Text className="flex-1 text-xs font-semibold text-white text-right">Montant</Text>
              </View>

              <View className="border border-slate-200 border-t-0 rounded-b-lg overflow-hidden">
                <View className="p-3 bg-white border-b border-slate-100">
                  <View className="flex-row items-center">
                    <View className="flex-[2]">
                      <Text className="font-medium text-slate-900">Prestation de portage salarial</Text>
                      <Text className="text-xs text-slate-500">{invoiceEmployees.length} salarié(s) - {getMonthName(invoice.month, invoice.year)}</Text>
                    </View>
                    <Text className="flex-1 text-right font-medium text-slate-900">{formatNumber(amountHT)} €</Text>
                  </View>
                </View>

                {invoiceEmployees.map((emp) => (
                  <View key={emp.id} className="p-3 bg-slate-50 border-b border-slate-100">
                    <View className="flex-row items-center">
                      <View className="flex-[2] pl-4">
                        <Text className="text-sm text-slate-600">└ {emp.full_name}</Text>
                        <Text className="text-xs text-slate-400">{emp.position} • {emp.hourly_rate}€/h</Text>
                      </View>
                      <Text className="flex-1 text-right text-sm text-slate-600">{formatNumber(151.67 * emp.hourly_rate)} €</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Totals */}
            <View className="p-5">
              <View className="ml-auto" style={{ width: 200 }}>
                <View className="flex-row justify-between py-2 border-b border-slate-100">
                  <Text className="text-slate-500">Total HT</Text>
                  <Text className="font-medium text-slate-900">{formatNumber(amountHT)} €</Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-slate-100">
                  <Text className="text-slate-500">TVA (20%)</Text>
                  <Text className="font-medium text-slate-900">{formatNumber(tvaAmount)} €</Text>
                </View>
                <View className="flex-row justify-between py-3 bg-indigo-600 rounded-lg px-3 mt-2">
                  <Text className="text-white font-semibold">Total TTC</Text>
                  <Text className="text-white font-bold text-lg">{formatNumber(amount)} €</Text>
                </View>
              </View>
            </View>

            {/* Payment Info */}
            <View className="p-5 bg-slate-50 border-t border-slate-100">
              <Text className="font-semibold text-slate-900 mb-3">Informations de paiement</Text>
              <View className="flex-row gap-6">
                <View>
                  <Text className="text-xs text-slate-500">IBAN</Text>
                  <Text className="text-sm font-medium text-slate-900">FR76 XXXX XXXX XXXX</Text>
                </View>
                <View>
                  <Text className="text-xs text-slate-500">BIC</Text>
                  <Text className="text-sm font-medium text-slate-900">BNPAFRPP</Text>
                </View>
              </View>
              <View className="bg-amber-50 rounded-lg p-3 mt-3 border border-amber-200">
                <Text className="text-xs text-amber-800">
                  Paiement à réception de facture. En cas de retard, pénalité de 3x le taux légal.
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3 mt-4">
            <Pressable
              onPress={generateAndSharePdf}
              disabled={isGeneratingPdf}
              className="flex-1 flex-row items-center justify-center gap-2 py-4 rounded-xl bg-indigo-500 active:bg-indigo-600"
            >
              {isGeneratingPdf ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Download size={20} color="white" />
                  <Text className="font-semibold text-white">Télécharger PDF</Text>
                </>
              )}
            </Pressable>
            <Pressable
              onPress={handleShare}
              disabled={isGeneratingPdf}
              className="flex-1 flex-row items-center justify-center gap-2 py-4 rounded-xl bg-white border border-slate-200 active:bg-slate-50"
            >
              <Share2 size={20} color="#6366f1" />
              <Text className="font-semibold text-indigo-600">Partager</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

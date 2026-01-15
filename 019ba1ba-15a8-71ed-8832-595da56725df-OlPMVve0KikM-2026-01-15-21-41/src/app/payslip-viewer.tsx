import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { X, Download, Share2 } from 'lucide-react-native';
import { usePayslips, useEmployees, useCompanies } from '@/lib/hooks/usePayflow';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

const PLAFOND_SS_MENSUEL = 3925.00; // 2025

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

export default function PayslipViewerScreen() {
  const { id, action } = useLocalSearchParams<{ id: string; action?: string }>();
  const viewRef = useRef<View>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [hasTriggeredShare, setHasTriggeredShare] = useState(false);

  const { data: payslips, isLoading: loadingPayslips } = usePayslips();
  const { data: employees } = useEmployees();
  const { data: companies } = useCompanies();

  const payslip = payslips?.find(p => p.id === id);
  const employee = employees?.find(e => e.id === payslip?.employee_id);
  const employerCompany = companies?.find(c => c.id === employee?.employer_company_id);

  // Calculate all values
  const hoursWorked = 151.67;
  const hourlyRate = employee?.hourly_rate ?? 0;
  const baseSalary = hoursWorked * hourlyRate;
  const grossSalary = payslip?.gross_salary ?? 0;
  const netSalary = payslip?.net_salary ?? 0;
  const prime = grossSalary - baseSalary;

  // CSG base (98.25% of gross)
  const csgBase = grossSalary * 0.9825;
  const plafondBase = Math.min(grossSalary, PLAFOND_SS_MENSUEL);

  // Employee deductions
  const deductionSociale = grossSalary * 0.069;
  const deductionSocialeDeplaf = grossSalary * 0.004;
  const deductionRetraiteComp = plafondBase * 0.0401;
  const csgDeductible = csgBase * 0.068;
  const csgNonDeductible = csgBase * 0.029;
  const totalEmployeeDeductions = grossSalary - netSalary;

  // Employer charges
  const employerMaladie = grossSalary * 0.07;
  const employerAccidents = grossSalary * 0.0096;
  const employerRetraiteBase = plafondBase * 0.0855;
  const employerRetraiteDeplaf = grossSalary * 0.002;
  const employerRetraiteComp = plafondBase * 0.0601;
  const employerFamille = grossSalary * 0.0345;
  const employerChomage = grossSalary * 0.0405;
  const employerFormation = grossSalary * 0.006;
  const employerAutres = grossSalary * 0.01946;
  const exonerationsCotisations = -grossSalary * 0.22;
  const totalEmployerCharges = employerMaladie + employerAccidents + employerRetraiteBase + employerRetraiteDeplaf + employerRetraiteComp + employerFamille + employerChomage + employerFormation + employerAutres + exonerationsCotisations;

  // Net social
  const netSocial = grossSalary - totalEmployeeDeductions + csgDeductible + csgNonDeductible;
  const monthNum = payslip ? parseInt(payslip.month) : 1;
  const cumulBrut = grossSalary * monthNum;
  const cumulNetFiscal = netSalary * monthNum + (csgDeductible * monthNum);
  const netImposable = netSalary + csgDeductible;
  const coutGlobal = grossSalary + totalEmployerCharges;
  const totalVerse = netSalary;
  const allegements = Math.abs(exonerationsCotisations);

  // Payment date
  const paymentDate = payslip ? new Date(payslip.year, parseInt(payslip.month), 0) : new Date();
  const paymentDateStr = `${paymentDate.getDate()}/${String(paymentDate.getMonth() + 1).padStart(2, '0')}/${payslip?.year ?? new Date().getFullYear()}`;

  const generatePdfHtml = () => {
    if (!payslip || !employee) return '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 9px; padding: 15px; color: #000; }
          .header { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .header-left { font-size: 9px; }
          .header-center { text-align: center; }
          .header-right { text-align: right; font-size: 9px; }
          .title { font-size: 16px; font-weight: bold; }
          .period { color: #1e3a8a; font-size: 11px; }
          .employee-section { display: flex; justify-content: space-between; margin: 10px 0; }
          .employee-left { font-size: 9px; line-height: 1.4; }
          .employee-box { background: #e8f5e9; border: 1px solid #81c784; padding: 10px; font-size: 9px; }
          .convention { background: #f5f5f5; padding: 5px; font-size: 8px; margin: 8px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 8px; }
          th { background: #1e3a5f; color: white; padding: 4px 2px; text-align: left; font-size: 8px; font-weight: bold; }
          th.right { text-align: right; }
          td { padding: 3px 2px; border-bottom: 1px solid #e0e0e0; font-size: 8px; }
          td.right { text-align: right; }
          .section-row td { font-weight: bold; background: #f5f5f5; }
          .total-row td { font-weight: bold; border-top: 1px solid #000; }
          .net-row { background: #1e3a5f; color: white; }
          .net-row td { color: white; font-weight: bold; border: none; }
          .footer-table { margin-top: 10px; }
          .footer-table th { font-size: 7px; padding: 3px; }
          .footer-table td { font-size: 8px; padding: 3px; text-align: center; }
          .conges-table { width: auto; margin-top: 10px; }
          .conges-table th, .conges-table td { padding: 3px 8px; text-align: center; }
          .net-box { background: #1e3a5f; color: white; padding: 10px 20px; text-align: right; font-size: 12px; font-weight: bold; display: inline-block; float: right; margin-top: 10px; }
          .payment-info { text-align: right; clear: both; padding-top: 5px; font-size: 8px; }
          .legal { font-size: 7px; color: #666; text-align: center; margin-top: 15px; padding-top: 10px; border-top: 1px solid #ccc; }
          .employer-charges { font-size: 7px; }
          .negative { color: #000; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            <strong>${employerCompany?.name ?? 'SYNPORTAGE'}</strong><br>
            ${employerCompany?.address ?? '76 Rue Pierre Jacoby'}<br>
            ${employerCompany?.postal_code ?? '60000'} ${employerCompany?.city ?? 'BEAUVAIS'}<br><br>
            Siret : ${employerCompany?.siret ?? '94344526200018'}&nbsp;&nbsp;&nbsp;Code Naf : 7022Z<br>
            Urssaf/Msa : ${employerCompany?.urssaf_number ?? '227 832766737'}
          </div>
          <div class="header-center">
            <div class="title">BULLETIN DE SALAIRE</div>
            <div class="period">Période : ${getMonthName(payslip.month, payslip.year)}</div>
          </div>
          <div class="header-right">
            <strong>${employerCompany?.name ?? 'SYNPORTAGE'}</strong>
          </div>
        </div>

        <div class="employee-section">
          <div class="employee-left">
            Matricule : <strong>${employee.id.slice(0, 5).toUpperCase()}</strong><br>
            N° SS : <strong>207063851601906</strong><br><br>
            Emploi : <strong>${employee.position}</strong><br>
            Statut professionnel : <strong>Employé</strong><br>
            Niveau : <strong>A</strong><br><br>
            Entrée : <strong>${formatDate(employee.hire_date)}</strong><br>
            Ancienneté : <strong>3 mois</strong>
          </div>
          <div class="employee-box">
            <strong>Madame/Monsieur ${employee.full_name}</strong><br>
            6 Grande Rue<br>
            38700 LA TRONCHE
          </div>
        </div>

        <div class="convention">
          Convention collective : <strong>Travail temporaire (salariés permanents)</strong>
        </div>

        <table>
          <tr>
            <th style="width:35%">Éléments de paie</th>
            <th class="right" style="width:12%">Base</th>
            <th class="right" style="width:10%">Taux</th>
            <th class="right" style="width:12%">À déduire</th>
            <th class="right" style="width:12%">À payer</th>
            <th class="right" style="width:19%">Charges patronales</th>
          </tr>
          <tr>
            <td>Salaire de base</td>
            <td class="right">${formatNumber(hoursWorked)}</td>
            <td class="right">${formatNumber(hourlyRate, 4)}</td>
            <td class="right"></td>
            <td class="right">${formatNumber(baseSalary)}</td>
            <td class="right"></td>
          </tr>
          ${prime > 0 ? `
          <tr>
            <td>Prime</td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right">${formatNumber(prime)}</td>
            <td class="right"></td>
          </tr>
          ` : ''}
          <tr class="section-row">
            <td><strong>Salaire brut</strong></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"><strong>${formatNumber(grossSalary)}</strong></td>
            <td class="right"></td>
          </tr>
          <tr class="section-row">
            <td>Santé</td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
          </tr>
          <tr>
            <td>Sécurité Sociale - Mal. Mat. Inval. Décès</td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right employer-charges">${formatNumber(grossSalary)}&nbsp;&nbsp;7,0000&nbsp;&nbsp;${formatNumber(employerMaladie)}</td>
          </tr>
          <tr>
            <td>Accidents du travail & mal. professionnelles</td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right employer-charges">${formatNumber(grossSalary)}&nbsp;&nbsp;0,9600&nbsp;&nbsp;${formatNumber(employerAccidents)}</td>
          </tr>
          <tr class="section-row">
            <td>Retraite</td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
          </tr>
          <tr>
            <td>Sécurité Sociale plafonnée</td>
            <td class="right">${formatNumber(grossSalary)}</td>
            <td class="right">6,9000</td>
            <td class="right">${formatNumber(deductionSociale)}</td>
            <td class="right"></td>
            <td class="right employer-charges">${formatNumber(grossSalary)}&nbsp;&nbsp;8,5500&nbsp;&nbsp;${formatNumber(employerRetraiteBase)}</td>
          </tr>
          <tr>
            <td>Sécurité Sociale déplafonnée</td>
            <td class="right">${formatNumber(grossSalary)}</td>
            <td class="right">0,4000</td>
            <td class="right">${formatNumber(deductionSocialeDeplaf)}</td>
            <td class="right"></td>
            <td class="right employer-charges">${formatNumber(grossSalary)}&nbsp;&nbsp;2,0200&nbsp;&nbsp;${formatNumber(employerRetraiteDeplaf)}</td>
          </tr>
          <tr>
            <td>Complémentaire Tranche 1</td>
            <td class="right">${formatNumber(grossSalary)}</td>
            <td class="right">4,0100</td>
            <td class="right">${formatNumber(deductionRetraiteComp)}</td>
            <td class="right"></td>
            <td class="right employer-charges">${formatNumber(grossSalary)}&nbsp;&nbsp;6,0100&nbsp;&nbsp;${formatNumber(employerRetraiteComp)}</td>
          </tr>
          <tr class="section-row">
            <td>Famille</td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right employer-charges">${formatNumber(grossSalary)}&nbsp;&nbsp;3,4500&nbsp;&nbsp;${formatNumber(employerFamille)}</td>
          </tr>
          <tr class="section-row">
            <td>Assurance chômage</td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right employer-charges">${formatNumber(grossSalary)}&nbsp;&nbsp;4,2500&nbsp;&nbsp;${formatNumber(employerChomage)}</td>
          </tr>
          <tr class="section-row">
            <td>Cst. statutaires ou prévues par la conv. coll.</td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
          </tr>
          <tr>
            <td>Développement formation professionnelle</td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right employer-charges">${formatNumber(grossSalary)}&nbsp;&nbsp;0,6000&nbsp;&nbsp;${formatNumber(employerFormation)}</td>
          </tr>
          <tr>
            <td><strong>Autres contributions dues par l'employeur</strong></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right employer-charges">${formatNumber(grossSalary)}&nbsp;&nbsp;1,9460&nbsp;&nbsp;${formatNumber(employerAutres)}</td>
          </tr>
          <tr>
            <td>Autres contributions dues par l'employeur</td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
          </tr>
          <tr>
            <td>CSG déduct. de l'impôt sur le revenu</td>
            <td class="right">${formatNumber(csgBase)}</td>
            <td class="right">6,8000</td>
            <td class="right">${formatNumber(csgDeductible)}</td>
            <td class="right"></td>
            <td class="right"></td>
          </tr>
          <tr>
            <td>CSG/CRDS non déduct. de l'impôt sur le revenu</td>
            <td class="right">${formatNumber(csgBase)}</td>
            <td class="right">2,9000</td>
            <td class="right">${formatNumber(csgNonDeductible)}</td>
            <td class="right"></td>
            <td class="right"></td>
          </tr>
          <tr>
            <td>Exonérations de cotisations employeur</td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right negative">${formatNumber(exonerationsCotisations)}</td>
          </tr>
          <tr class="total-row">
            <td><strong>Total des cotisations et contributions</strong></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"><strong>${formatNumber(totalEmployeeDeductions)}</strong></td>
            <td class="right"></td>
            <td class="right"><strong>${formatNumber(totalEmployerCharges)}</strong></td>
          </tr>
          <tr>
            <td>Exonération sur HC/HS/RTT : cumul net fiscal annuel</td>
            <td class="right">${formatNumber(cumulNetFiscal)}</td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
          </tr>
          <tr>
            <td>Montant net social</td>
            <td class="right">${formatNumber(netSocial)}</td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
          </tr>
          <tr class="section-row">
            <td><strong>Net à payer avant impôt sur le revenu</strong></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"><strong>${formatNumber(netSalary)}</strong></td>
            <td class="right"></td>
          </tr>
          <tr>
            <td>dont évolution de la rémunération liée à la<br>suppression des cotisations chômage et maladie</td>
            <td class="right">30,09</td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
          </tr>
          <tr>
            <td>Impôt sur le revenu prélevé à la source - PAS</td>
            <td class="right">${formatNumber(netSalary)}</td>
            <td class="right">0,0000</td>
            <td class="right">0,00</td>
            <td class="right"></td>
            <td class="right"></td>
          </tr>
          <tr>
            <td style="padding-left:20px">Taux non personnalisé</td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
          </tr>
          <tr class="net-row">
            <td><strong>Net payé</strong></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"></td>
            <td class="right"><strong>${formatNumber(netSalary)}</strong></td>
            <td class="right"></td>
          </tr>
        </table>

        <table class="footer-table">
          <tr>
            <th></th>
            <th>Heures</th>
            <th>Heures suppl.</th>
            <th>Brut</th>
            <th>Plafond S.S.</th>
            <th>Net imposable</th>
            <th>Ch. patronales</th>
            <th>Coût Global</th>
            <th>Total versé</th>
            <th>Allègements</th>
          </tr>
          <tr>
            <td style="text-align:left"><strong>Mensuel</strong></td>
            <td>${formatNumber(hoursWorked)}</td>
            <td></td>
            <td>${formatNumber(grossSalary)}</td>
            <td>${formatNumber(PLAFOND_SS_MENSUEL)}</td>
            <td>${formatNumber(netImposable)}</td>
            <td>${formatNumber(totalEmployerCharges)}</td>
            <td>${formatNumber(coutGlobal)}</td>
            <td>${formatNumber(totalVerse)}</td>
            <td>${formatNumber(allegements)}</td>
          </tr>
          <tr>
            <td style="text-align:left"><strong>Annuel</strong></td>
            <td>${formatNumber(hoursWorked * monthNum)}</td>
            <td></td>
            <td>${formatNumber(cumulBrut)}</td>
            <td>${formatNumber(PLAFOND_SS_MENSUEL * monthNum)}</td>
            <td>${formatNumber(netImposable * monthNum)}</td>
            <td>${formatNumber(totalEmployerCharges * monthNum)}</td>
            <td>${formatNumber(coutGlobal * monthNum)}</td>
            <td>${formatNumber(totalVerse * monthNum)}</td>
            <td>${formatNumber(allegements * monthNum)}</td>
          </tr>
        </table>

        <table class="conges-table" style="float:left;">
          <tr>
            <th style="background:#1e3a5f;color:white;">Congés N-1</th>
            <th style="background:#1e3a5f;color:white;">Congés N</th>
          </tr>
          <tr>
            <td style="text-align:left;">Acquis</td>
            <td>7,75</td>
          </tr>
          <tr>
            <td style="text-align:left;">Pris</td>
            <td></td>
          </tr>
          <tr>
            <td style="text-align:left;"><strong>Solde</strong></td>
            <td><strong>7,75</strong></td>
          </tr>
        </table>

        <div class="net-box">Net payé : ${formatNumber(netSalary)} euros</div>
        <div class="payment-info">Paiement le ${paymentDateStr} par Virement</div>

        <div class="legal">
          Dans votre intérêt, et pour vous aider à faire valoir vos droits, conservez ce bulletin de paie sans limitation de durée. Informations complémentaires : www.service-public.fr
        </div>
      </body>
      </html>
    `;
  };

  const generateAndSharePdf = async () => {
    if (isGeneratingPdf || !payslip || !employee) return;
    setIsGeneratingPdf(true);

    try {
      const html = generatePdfHtml();
      const { uri } = await Print.printToFileAsync({ html });

      const filename = `bulletin_${employee.full_name.replace(/\s/g, '_')}_${payslip.month}_${payslip.year}.pdf`;
      const newPath = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.moveAsync({
        from: uri,
        to: newPath,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newPath, {
          mimeType: 'application/pdf',
          dialogTitle: `Bulletin de paie - ${employee.full_name} - ${getMonthName(payslip.month, payslip.year)}`,
        });
      } else {
        Alert.alert('Succès', `Bulletin PDF sauvegardé: ${filename}`);
      }
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      Alert.alert('Erreur', 'Impossible de générer le PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Auto-trigger share if action=share
  useEffect(() => {
    if (action === 'share' && payslip && employee && !hasTriggeredShare && !loadingPayslips) {
      setHasTriggeredShare(true);
      const timer = setTimeout(() => {
        generateAndSharePdf();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [action, payslip, employee, hasTriggeredShare, loadingPayslips]);

  if (loadingPayslips) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-slate-500 mt-3">Chargement du bulletin...</Text>
      </SafeAreaView>
    );
  }

  if (!payslip || !employee) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-slate-500">Bulletin introuvable</Text>
        <Pressable onPress={() => router.back()} className="mt-4 px-4 py-2 bg-indigo-500 rounded-lg">
          <Text className="text-white font-medium">Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const handleDownload = async () => {
    try {
      if (viewRef.current) {
        const uri = await captureRef(viewRef, {
          format: 'png',
          quality: 1,
        });

        const filename = `bulletin_${employee.full_name.replace(/\s/g, '_')}_${payslip.month}_${payslip.year}.png`;
        const newPath = `${FileSystem.documentDirectory}${filename}`;

        await FileSystem.copyAsync({
          from: uri,
          to: newPath,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(newPath);
        } else {
          Alert.alert('Succès', `Bulletin sauvegardé: ${filename}`);
        }
      }
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      Alert.alert('Erreur', 'Impossible de télécharger le bulletin');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-100" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <X size={24} color="#64748b" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900" numberOfLines={1}>
          {employee.full_name}
        </Text>
        <View className="flex-row gap-2">
          <Pressable onPress={generateAndSharePdf} className="p-2" disabled={isGeneratingPdf}>
            {isGeneratingPdf ? (
              <ActivityIndicator size="small" color="#6366f1" />
            ) : (
              <Share2 size={22} color="#6366f1" />
            )}
          </Pressable>
          <Pressable onPress={handleDownload} className="p-2">
            <Download size={22} color="#6366f1" />
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-3">
          {/* Payslip Document Preview */}
          <View ref={viewRef} collapsable={false} className="bg-white overflow-hidden" style={{ borderWidth: 1, borderColor: '#000' }}>
            {/* Header */}
            <View className="flex-row p-3 border-b border-slate-300">
              <View className="flex-1">
                <Text className="font-bold text-slate-900 text-xs">{employerCompany?.name ?? 'SYNPORTAGE'}</Text>
                <Text className="text-[10px] text-slate-600">{employerCompany?.address ?? '76 Rue Pierre Jacoby'}</Text>
                <Text className="text-[10px] text-slate-600">{employerCompany?.postal_code ?? '60000'} {employerCompany?.city ?? 'BEAUVAIS'}</Text>
                <Text className="text-[10px] text-slate-500 mt-2">Siret : {employerCompany?.siret ?? '94344526200018'}    Code Naf : 7022Z</Text>
                <Text className="text-[10px] text-slate-500">Urssaf/Msa : {employerCompany?.urssaf_number ?? '227 832766737'}</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="font-bold text-base text-slate-900">BULLETIN DE SALAIRE</Text>
                <Text className="text-xs text-blue-700">Période : {getMonthName(payslip.month, payslip.year)}</Text>
              </View>
              <View className="flex-1 items-end">
                <Text className="font-bold text-slate-900 text-xs">{employerCompany?.name ?? 'SYNPORTAGE'}</Text>
              </View>
            </View>

            {/* Employee Info */}
            <View className="flex-row p-3 border-b border-slate-200">
              <View className="flex-1">
                <Text className="text-[10px] text-slate-600">Matricule : <Text className="font-bold text-slate-900">{employee.id.slice(0, 5).toUpperCase()}</Text></Text>
                <Text className="text-[10px] text-slate-600">N° SS : <Text className="font-bold text-slate-900">207063851601906</Text></Text>
                <Text className="text-[10px] text-slate-600 mt-2">Emploi : <Text className="font-bold text-slate-900">{employee.position}</Text></Text>
                <Text className="text-[10px] text-slate-600">Statut professionnel : <Text className="font-bold text-slate-900">Employé</Text></Text>
                <Text className="text-[10px] text-slate-600">Niveau : <Text className="font-bold text-slate-900">A</Text></Text>
                <Text className="text-[10px] text-slate-600 mt-2">Entrée : <Text className="font-bold text-slate-900">{formatDate(employee.hire_date)}</Text></Text>
                <Text className="text-[10px] text-slate-600">Ancienneté : <Text className="font-bold text-slate-900">3 mois</Text></Text>
              </View>
              <View className="flex-1 ml-4 p-3 rounded" style={{ backgroundColor: '#e8f5e9', borderWidth: 1, borderColor: '#81c784' }}>
                <Text className="font-bold text-slate-900 text-xs">Madame/Monsieur {employee.full_name}</Text>
                <Text className="text-[10px] text-slate-700">6 Grande Rue</Text>
                <Text className="text-[10px] text-slate-700">38700 LA TRONCHE</Text>
              </View>
            </View>

            {/* Convention */}
            <View className="px-3 py-2 bg-slate-100 border-b border-slate-200">
              <Text className="text-[10px] text-slate-600">Convention collective : <Text className="font-bold">Travail temporaire (salariés permanents)</Text></Text>
            </View>

            {/* Main Table */}
            <View>
              {/* Header Row */}
              <View className="flex-row py-1.5 px-1" style={{ backgroundColor: '#1e3a5f' }}>
                <Text className="flex-[2.5] text-[9px] font-bold text-white">Éléments de paie</Text>
                <Text className="flex-1 text-[9px] font-bold text-white text-right">Base</Text>
                <Text className="flex-[0.8] text-[9px] font-bold text-white text-right">Taux</Text>
                <Text className="flex-1 text-[9px] font-bold text-white text-right">À déduire</Text>
                <Text className="flex-1 text-[9px] font-bold text-white text-right">À payer</Text>
                <Text className="flex-[1.4] text-[9px] font-bold text-white text-right">Charges patronales</Text>
              </View>

              {/* Salaire de base */}
              <View className="flex-row py-1 px-1 border-b border-slate-100">
                <Text className="flex-[2.5] text-[9px] text-slate-700">Salaire de base</Text>
                <Text className="flex-1 text-[9px] text-slate-900 text-right">{formatNumber(hoursWorked)}</Text>
                <Text className="flex-[0.8] text-[9px] text-slate-900 text-right">{formatNumber(hourlyRate, 4)}</Text>
                <Text className="flex-1 text-[9px] text-slate-900 text-right"></Text>
                <Text className="flex-1 text-[9px] text-slate-900 text-right">{formatNumber(baseSalary)}</Text>
                <Text className="flex-[1.4] text-[9px] text-slate-900 text-right"></Text>
              </View>

              {/* Prime */}
              {prime > 0 && (
                <View className="flex-row py-1 px-1 border-b border-slate-100">
                  <Text className="flex-[2.5] text-[9px] text-slate-700">Prime</Text>
                  <Text className="flex-1 text-[9px] text-slate-900 text-right"></Text>
                  <Text className="flex-[0.8] text-[9px] text-slate-900 text-right"></Text>
                  <Text className="flex-1 text-[9px] text-slate-900 text-right"></Text>
                  <Text className="flex-1 text-[9px] text-slate-900 text-right">{formatNumber(prime)}</Text>
                  <Text className="flex-[1.4] text-[9px] text-slate-900 text-right"></Text>
                </View>
              )}

              {/* Salaire brut */}
              <View className="flex-row py-1 px-1 bg-slate-50 border-b border-slate-200">
                <Text className="flex-[2.5] text-[9px] font-bold text-slate-900">Salaire brut</Text>
                <Text className="flex-1 text-[9px] text-slate-900 text-right"></Text>
                <Text className="flex-[0.8] text-[9px] text-slate-900 text-right"></Text>
                <Text className="flex-1 text-[9px] text-slate-900 text-right"></Text>
                <Text className="flex-1 text-[9px] font-bold text-slate-900 text-right">{formatNumber(grossSalary)}</Text>
                <Text className="flex-[1.4] text-[9px] text-slate-900 text-right"></Text>
              </View>

              {/* Santé */}
              <View className="flex-row py-1 px-1 bg-slate-50 border-b border-slate-100">
                <Text className="flex-[2.5] text-[9px] font-bold text-blue-800">Santé</Text>
                <Text className="flex-1 text-[9px] text-slate-900 text-right"></Text>
                <Text className="flex-[0.8] text-[9px] text-slate-900 text-right"></Text>
                <Text className="flex-1 text-[9px] text-slate-900 text-right"></Text>
                <Text className="flex-1 text-[9px] text-slate-900 text-right"></Text>
                <Text className="flex-[1.4] text-[9px] text-slate-900 text-right"></Text>
              </View>
              <View className="flex-row py-0.5 px-1 border-b border-slate-100">
                <Text className="flex-[2.5] text-[8px] text-slate-600">Sécurité Sociale - Mal. Mat. Inval. Décès</Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-[0.8] text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-[1.4] text-[8px] text-slate-700 text-right">{formatNumber(grossSalary)}  7,0000  {formatNumber(employerMaladie)}</Text>
              </View>
              <View className="flex-row py-0.5 px-1 border-b border-slate-100">
                <Text className="flex-[2.5] text-[8px] text-slate-600">Accidents du travail & mal. professionnelles</Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-[0.8] text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-[1.4] text-[8px] text-slate-700 text-right">{formatNumber(grossSalary)}  0,9600  {formatNumber(employerAccidents)}</Text>
              </View>

              {/* Retraite */}
              <View className="flex-row py-1 px-1 bg-slate-50 border-b border-slate-100">
                <Text className="flex-[2.5] text-[9px] font-bold text-blue-800">Retraite</Text>
                <Text className="flex-1 text-[9px] text-slate-900 text-right"></Text>
                <Text className="flex-[0.8] text-[9px] text-slate-900 text-right"></Text>
                <Text className="flex-1 text-[9px] text-slate-900 text-right"></Text>
                <Text className="flex-1 text-[9px] text-slate-900 text-right"></Text>
                <Text className="flex-[1.4] text-[9px] text-slate-900 text-right"></Text>
              </View>
              <View className="flex-row py-0.5 px-1 border-b border-slate-100">
                <Text className="flex-[2.5] text-[8px] text-slate-600">Sécurité Sociale plafonnée</Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right">{formatNumber(grossSalary)}</Text>
                <Text className="flex-[0.8] text-[8px] text-slate-900 text-right">6,9000</Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right">{formatNumber(deductionSociale)}</Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-[1.4] text-[8px] text-slate-700 text-right">{formatNumber(grossSalary)}  8,5500  {formatNumber(employerRetraiteBase)}</Text>
              </View>
              <View className="flex-row py-0.5 px-1 border-b border-slate-100">
                <Text className="flex-[2.5] text-[8px] text-slate-600">Sécurité Sociale déplafonnée</Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right">{formatNumber(grossSalary)}</Text>
                <Text className="flex-[0.8] text-[8px] text-slate-900 text-right">0,4000</Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right">{formatNumber(deductionSocialeDeplaf)}</Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-[1.4] text-[8px] text-slate-700 text-right">{formatNumber(grossSalary)}  2,0200  {formatNumber(employerRetraiteDeplaf)}</Text>
              </View>
              <View className="flex-row py-0.5 px-1 border-b border-slate-100">
                <Text className="flex-[2.5] text-[8px] text-slate-600">Complémentaire Tranche 1</Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right">{formatNumber(grossSalary)}</Text>
                <Text className="flex-[0.8] text-[8px] text-slate-900 text-right">4,0100</Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right">{formatNumber(deductionRetraiteComp)}</Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-[1.4] text-[8px] text-slate-700 text-right">{formatNumber(grossSalary)}  6,0100  {formatNumber(employerRetraiteComp)}</Text>
              </View>

              {/* Famille */}
              <View className="flex-row py-1 px-1 bg-slate-50 border-b border-slate-100">
                <Text className="flex-[2.5] text-[9px] font-bold text-blue-800">Famille</Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-[0.8] text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-[1.4] text-[8px] text-slate-700 text-right">{formatNumber(grossSalary)}  3,4500  {formatNumber(employerFamille)}</Text>
              </View>

              {/* Chômage */}
              <View className="flex-row py-1 px-1 bg-slate-50 border-b border-slate-100">
                <Text className="flex-[2.5] text-[9px] font-bold text-blue-800">Assurance chômage</Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-[0.8] text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-[1.4] text-[8px] text-slate-700 text-right">{formatNumber(grossSalary)}  4,2500  {formatNumber(employerChomage)}</Text>
              </View>

              {/* Autres */}
              <View className="flex-row py-1 px-1 bg-slate-50 border-b border-slate-100">
                <Text className="flex-[2.5] text-[8px] font-bold text-blue-800">Cst. statutaires ou prévues par la conv. coll.</Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-[0.8] text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-[1.4] text-[8px] text-slate-900 text-right"></Text>
              </View>
              <View className="flex-row py-0.5 px-1 border-b border-slate-100">
                <Text className="flex-[2.5] text-[8px] text-slate-600">Développement formation professionnelle</Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-[0.8] text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-[1.4] text-[8px] text-slate-700 text-right">{formatNumber(grossSalary)}  0,6000  {formatNumber(employerFormation)}</Text>
              </View>
              <View className="flex-row py-0.5 px-1 border-b border-slate-100">
                <Text className="flex-[2.5] text-[8px] font-bold text-slate-700">Autres contributions dues par l'employeur</Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-[0.8] text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-[1.4] text-[8px] text-slate-700 text-right">{formatNumber(grossSalary)}  1,9460  {formatNumber(employerAutres)}</Text>
              </View>

              {/* CSG */}
              <View className="flex-row py-0.5 px-1 border-b border-slate-100">
                <Text className="flex-[2.5] text-[8px] text-slate-600">CSG déduct. de l'impôt sur le revenu</Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right">{formatNumber(csgBase)}</Text>
                <Text className="flex-[0.8] text-[8px] text-slate-900 text-right">6,8000</Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right">{formatNumber(csgDeductible)}</Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-[1.4] text-[8px] text-slate-900 text-right"></Text>
              </View>
              <View className="flex-row py-0.5 px-1 border-b border-slate-100">
                <Text className="flex-[2.5] text-[8px] text-slate-600">CSG/CRDS non déduct. de l'impôt sur le revenu</Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right">{formatNumber(csgBase)}</Text>
                <Text className="flex-[0.8] text-[8px] text-slate-900 text-right">2,9000</Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right">{formatNumber(csgNonDeductible)}</Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-[1.4] text-[8px] text-slate-900 text-right"></Text>
              </View>

              {/* Exonérations */}
              <View className="flex-row py-0.5 px-1 border-b border-slate-100">
                <Text className="flex-[2.5] text-[8px] text-slate-600">Exonérations de cotisations employeur</Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-[0.8] text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-[1.4] text-[8px] text-emerald-600 text-right">{formatNumber(exonerationsCotisations)}</Text>
              </View>

              {/* Total cotisations */}
              <View className="flex-row py-1.5 px-1 bg-slate-100 border-b border-slate-300">
                <Text className="flex-[2.5] text-[9px] font-bold text-slate-900">Total des cotisations et contributions</Text>
                <Text className="flex-1 text-[9px] text-slate-900 text-right"></Text>
                <Text className="flex-[0.8] text-[9px] text-slate-900 text-right"></Text>
                <Text className="flex-1 text-[9px] font-bold text-slate-900 text-right">{formatNumber(totalEmployeeDeductions)}</Text>
                <Text className="flex-1 text-[9px] text-slate-900 text-right"></Text>
                <Text className="flex-[1.4] text-[9px] font-bold text-slate-900 text-right">{formatNumber(totalEmployerCharges)}</Text>
              </View>

              {/* Net fiscal */}
              <View className="flex-row py-0.5 px-1 border-b border-slate-100">
                <Text className="flex-[2.5] text-[8px] text-slate-600">Exonération sur HC/HS/RTT : cumul net fiscal annuel</Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right">{formatNumber(cumulNetFiscal)}</Text>
                <Text className="flex-[0.8] text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-[1.4] text-[8px] text-slate-900 text-right"></Text>
              </View>
              <View className="flex-row py-0.5 px-1 border-b border-slate-100">
                <Text className="flex-[2.5] text-[8px] text-slate-600">Montant net social</Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right">{formatNumber(netSocial)}</Text>
                <Text className="flex-[0.8] text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-[1.4] text-[8px] text-slate-900 text-right"></Text>
              </View>

              {/* Net avant impôt */}
              <View className="flex-row py-1.5 px-1 bg-blue-50 border-b border-blue-200">
                <Text className="flex-[2.5] text-[9px] font-bold text-slate-900">Net à payer avant impôt sur le revenu</Text>
                <Text className="flex-1 text-[9px] text-slate-900 text-right"></Text>
                <Text className="flex-[0.8] text-[9px] text-slate-900 text-right"></Text>
                <Text className="flex-1 text-[9px] text-slate-900 text-right"></Text>
                <Text className="flex-1 text-[9px] font-bold text-blue-700 text-right">{formatNumber(netSalary)}</Text>
                <Text className="flex-[1.4] text-[9px] text-slate-900 text-right"></Text>
              </View>

              {/* PAS */}
              <View className="flex-row py-0.5 px-1 border-b border-slate-100">
                <Text className="flex-[2.5] text-[8px] text-slate-600">Impôt sur le revenu prélevé à la source - PAS</Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right">{formatNumber(netSalary)}</Text>
                <Text className="flex-[0.8] text-[8px] text-slate-900 text-right">0,0000</Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right">0,00</Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-[1.4] text-[8px] text-slate-900 text-right"></Text>
              </View>
              <View className="flex-row py-0.5 px-1 border-b border-slate-100">
                <Text className="flex-[2.5] text-[8px] text-slate-500 pl-3">Taux non personnalisé</Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-[0.8] text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-1 text-[8px] text-slate-900 text-right"></Text>
                <Text className="flex-[1.4] text-[8px] text-slate-900 text-right"></Text>
              </View>

              {/* Net payé */}
              <View className="flex-row py-2 px-1" style={{ backgroundColor: '#1e3a5f' }}>
                <Text className="flex-[2.5] text-[10px] font-bold text-white">Net payé</Text>
                <Text className="flex-1 text-[10px] text-white text-right"></Text>
                <Text className="flex-[0.8] text-[10px] text-white text-right"></Text>
                <Text className="flex-1 text-[10px] text-white text-right"></Text>
                <Text className="flex-1 text-[10px] font-bold text-white text-right">{formatNumber(netSalary)}</Text>
                <Text className="flex-[1.4] text-[10px] text-white text-right"></Text>
              </View>
            </View>

            {/* Footer */}
            <View className="p-3 bg-slate-50 border-t border-slate-300">
              {/* Summary Table */}
              <View className="border border-slate-300 rounded overflow-hidden mb-3">
                <View className="flex-row py-1 px-0.5" style={{ backgroundColor: '#1e3a5f' }}>
                  <Text className="flex-1 text-[7px] font-bold text-white text-center"></Text>
                  <Text className="flex-1 text-[7px] font-bold text-white text-center">Heures</Text>
                  <Text className="flex-1 text-[7px] font-bold text-white text-center">Heures suppl.</Text>
                  <Text className="flex-1 text-[7px] font-bold text-white text-center">Brut</Text>
                  <Text className="flex-1 text-[7px] font-bold text-white text-center">Plafond S.S.</Text>
                  <Text className="flex-1 text-[7px] font-bold text-white text-center">Net imposable</Text>
                  <Text className="flex-1 text-[7px] font-bold text-white text-center">Ch. patronales</Text>
                  <Text className="flex-1 text-[7px] font-bold text-white text-center">Coût Global</Text>
                  <Text className="flex-1 text-[7px] font-bold text-white text-center">Total versé</Text>
                  <Text className="flex-1 text-[7px] font-bold text-white text-center">Allègements</Text>
                </View>
                <View className="flex-row py-1 px-0.5 border-b border-slate-200">
                  <Text className="flex-1 text-[8px] font-medium text-slate-700">Mensuel</Text>
                  <Text className="flex-1 text-[8px] text-slate-900 text-center">{formatNumber(hoursWorked)}</Text>
                  <Text className="flex-1 text-[8px] text-slate-900 text-center"></Text>
                  <Text className="flex-1 text-[8px] text-slate-900 text-center">{formatNumber(grossSalary)}</Text>
                  <Text className="flex-1 text-[8px] text-slate-900 text-center">{formatNumber(PLAFOND_SS_MENSUEL)}</Text>
                  <Text className="flex-1 text-[8px] text-slate-900 text-center">{formatNumber(netImposable)}</Text>
                  <Text className="flex-1 text-[8px] text-slate-900 text-center">{formatNumber(totalEmployerCharges)}</Text>
                  <Text className="flex-1 text-[8px] text-slate-900 text-center">{formatNumber(coutGlobal)}</Text>
                  <Text className="flex-1 text-[8px] text-slate-900 text-center">{formatNumber(totalVerse)}</Text>
                  <Text className="flex-1 text-[8px] text-slate-900 text-center">{formatNumber(allegements)}</Text>
                </View>
                <View className="flex-row py-1 px-0.5">
                  <Text className="flex-1 text-[8px] font-medium text-slate-700">Annuel</Text>
                  <Text className="flex-1 text-[8px] text-slate-900 text-center">{formatNumber(hoursWorked * monthNum)}</Text>
                  <Text className="flex-1 text-[8px] text-slate-900 text-center"></Text>
                  <Text className="flex-1 text-[8px] text-slate-900 text-center">{formatNumber(cumulBrut)}</Text>
                  <Text className="flex-1 text-[8px] text-slate-900 text-center">{formatNumber(PLAFOND_SS_MENSUEL * monthNum)}</Text>
                  <Text className="flex-1 text-[8px] text-slate-900 text-center">{formatNumber(netImposable * monthNum)}</Text>
                  <Text className="flex-1 text-[8px] text-slate-900 text-center">{formatNumber(totalEmployerCharges * monthNum)}</Text>
                  <Text className="flex-1 text-[8px] text-slate-900 text-center">{formatNumber(coutGlobal * monthNum)}</Text>
                  <Text className="flex-1 text-[8px] text-slate-900 text-center">{formatNumber(totalVerse * monthNum)}</Text>
                  <Text className="flex-1 text-[8px] text-slate-900 text-center">{formatNumber(allegements * monthNum)}</Text>
                </View>
              </View>

              {/* Congés + Net Box */}
              <View className="flex-row justify-between items-end">
                <View className="border border-slate-300 rounded overflow-hidden">
                  <View className="flex-row py-1 px-2" style={{ backgroundColor: '#1e3a5f' }}>
                    <Text className="w-16 text-[8px] font-bold text-white">Congés N-1</Text>
                    <Text className="w-16 text-[8px] font-bold text-white text-center">Congés N</Text>
                  </View>
                  <View className="flex-row py-0.5 px-2 border-b border-slate-200">
                    <Text className="w-16 text-[8px] text-slate-600">Acquis</Text>
                    <Text className="w-16 text-[8px] text-slate-900 text-center">7,75</Text>
                  </View>
                  <View className="flex-row py-0.5 px-2 border-b border-slate-200">
                    <Text className="w-16 text-[8px] text-slate-600">Pris</Text>
                    <Text className="w-16 text-[8px] text-slate-900 text-center"></Text>
                  </View>
                  <View className="flex-row py-0.5 px-2">
                    <Text className="w-16 text-[8px] font-medium text-slate-700">Solde</Text>
                    <Text className="w-16 text-[8px] font-medium text-slate-900 text-center">7,75</Text>
                  </View>
                </View>

                <View className="items-end">
                  <View className="rounded px-4 py-2" style={{ backgroundColor: '#1e3a5f' }}>
                    <Text className="text-white font-bold text-sm">Net payé : {formatNumber(netSalary)} euros</Text>
                  </View>
                  <Text className="text-[9px] text-slate-500 mt-1">Paiement le {paymentDateStr} par Virement</Text>
                </View>
              </View>

              {/* Legal */}
              <Text className="text-[8px] text-slate-400 mt-3 text-center">
                Dans votre intérêt, et pour vous aider à faire valoir vos droits, conservez ce bulletin de paie sans limitation de durée. Informations complémentaires : www.service-public.fr
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

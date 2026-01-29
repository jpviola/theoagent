import { Book, Scroll, History, Calendar } from 'lucide-react';

export interface StudyTrack {
  id: string;
  title: { es: string; pt: string; en: string };
  price: string;
  icon: any; // Using any to avoid complex type issues with Lucide icons in data files
}

export const STUDY_TRACKS: StudyTrack[] = [
  {
    id: 'dogmatic-theology',
    title: { es: 'Teología Dogmática', pt: 'Teologia Dogmática', en: 'Dogmatic Theology' },
    price: 'Soon',
    icon: Book
  },
  {
    id: 'biblical-theology',
    title: { es: 'Teología Bíblica', pt: 'Teologia Bíblica', en: 'Biblical Theology' },
    price: 'Soon',
    icon: Scroll
  },
  {
    id: 'church-history',
    title: { es: 'Historia de la Iglesia', pt: 'História da Igreja', en: 'Church History' },
    price: 'Soon',
    icon: History
  },
  {
    id: 'bible-study-plan',
    title: { es: 'Plan de Estudio Bíblico', pt: 'Plano de Estudo Bíblico', en: 'Bible Study Plan' },
    price: 'Soon',
    icon: Calendar
  },
  {
    id: 'biblical-greek',
    title: { es: 'Griego Bíblico', pt: 'Grego Bíblico', en: 'Biblical Greek' },
    price: 'Soon',
    icon: Scroll
  },
  {
    id: 'ecclesiastical-latin',
    title: { es: 'Latín Eclesiástico', pt: 'Latim Eclesiástico', en: 'Ecclesiastical Latin' },
    price: 'Soon',
    icon: Book
  }
];

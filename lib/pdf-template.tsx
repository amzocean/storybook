import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';

// Use built-in PDF fonts (no CDN fetching needed — works reliably on Vercel)
// Times-Roman = serif (titles), Helvetica = sans-serif (body)
const FONT_SERIF = 'Times-Roman';
const FONT_SERIF_BOLD = 'Times-Bold';
const FONT_SANS = 'Helvetica';
const FONT_SANS_BOLD = 'Helvetica-Bold';
const FONT_SANS_OBLIQUE = 'Helvetica-Oblique';

const CREAM = '#FFF8F0';
const AMBER_DARK = '#92400E';
const AMBER_MED = '#B45309';
const AMBER_LIGHT = '#D97706';
const GOLD = '#F59E0B';
const WHITE = '#FFFFFF';
const GRAY = '#6B7280';

const styles = StyleSheet.create({
  // ─── Cover page ───────────────────────────────────────────
  coverPage: {
    backgroundColor: CREAM,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
    position: 'relative',
  },
  coverImageContainer: {
    width: 420,
    height: 420,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 30,
    border: `6px solid ${WHITE}`,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  coverTitle: {
    fontFamily: FONT_SERIF_BOLD,
    fontSize: 38,
    color: AMBER_DARK,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 1.2,
    maxWidth: 550,
  },
  coverDescription: {
    fontFamily: FONT_SANS_OBLIQUE,
    fontSize: 14,
    color: AMBER_MED,
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 450,
    lineHeight: 1.5,
  },
  coverAuthor: {
    fontFamily: FONT_SANS_BOLD,
    fontSize: 16,
    color: AMBER_LIGHT,
    textAlign: 'center',
    marginBottom: 8,
  },
  coverMeta: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  coverBadge: {
    fontFamily: FONT_SANS,
    fontSize: 11,
    color: GRAY,
    backgroundColor: WHITE,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  coverDivider: {
    width: 80,
    height: 2,
    backgroundColor: GOLD,
    marginVertical: 16,
    borderRadius: 1,
  },

  // ─── Story pages ──────────────────────────────────────────
  storyPage: {
    backgroundColor: CREAM,
    flexDirection: 'column',
    padding: 0,
    position: 'relative',
  },
  storyImageContainer: {
    width: '100%',
    height: '65%',
    overflow: 'hidden',
    backgroundColor: '#F5F0E8',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  storyImage: {
    height: '100%',
    objectFit: 'cover',
  },
  storyTextContainer: {
    flex: 1,
    paddingHorizontal: 50,
    paddingTop: 16,
    paddingBottom: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageNumber: {
    fontFamily: FONT_SANS,
    fontSize: 11,
    color: AMBER_LIGHT,
    position: 'absolute',
    bottom: 22,
    right: 40,
  },

  // ─── End page ─────────────────────────────────────────────
  endPage: {
    backgroundColor: CREAM,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    position: 'relative',
  },
  endEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  endTitle: {
    fontFamily: FONT_SERIF_BOLD,
    fontSize: 42,
    color: AMBER_DARK,
    textAlign: 'center',
    marginBottom: 20,
  },
  endAuthor: {
    fontFamily: FONT_SANS_BOLD,
    fontSize: 18,
    color: AMBER_MED,
    textAlign: 'center',
    marginBottom: 6,
  },
  endStoryTitle: {
    fontFamily: FONT_SERIF,
    fontSize: 22,
    color: AMBER_DARK,
    textAlign: 'center',
    marginBottom: 30,
  },
  endDivider: {
    width: 60,
    height: 2,
    backgroundColor: GOLD,
    marginBottom: 24,
    borderRadius: 1,
  },
  endBranding: {
    fontFamily: FONT_SANS,
    fontSize: 13,
    color: GRAY,
    textAlign: 'center',
    lineHeight: 1.6,
  },

  // ─── Footer (all pages) ───────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: FONT_SANS,
    fontSize: 9,
    color: '#9CA3AF',
    letterSpacing: 1.2,
  },
});

interface PageData {
  page_number: number;
  text: string;
  image_path: string | null;
}

interface StoryPDFProps {
  title: string;
  description?: string;
  cover_image?: string;
  author_name?: string;
  author_credit?: string;
  age_range?: string;
  categoryName?: string;
  categoryEmoji?: string;
  pages: PageData[];
  pageSize?: string;
  printerSafe?: boolean;
}

function getAuthorLabel(credit?: string): string {
  if (credit === 'authored') return 'Written by';
  if (credit === 'coauthored') return 'Co-authored by';
  return 'Imagined by';
}

const Footer = () => (
  <View style={styles.footer}>
    <Text style={styles.footerText}>Created with StorySparks.fun</Text>
  </View>
);

export function StoryPDF({
  title,
  description,
  cover_image,
  author_name,
  author_credit,
  age_range,
  categoryName,
  pages,
  pageSize = 'LETTER',
  printerSafe = false,
}: StoryPDFProps) {
  // Filter out pages with no text (prevents blank pages)
  const validPages = pages.filter(p => p.text && p.text.trim().length > 0);
  const bg = printerSafe ? WHITE : CREAM;
  const size = pageSize as 'LETTER' | 'A4';

  return (
    <Document
      title={title}
      author={author_name || 'Story Sparks'}
      subject={description || `A Story Sparks storybook`}
      creator="Story Sparks - storysparks.fun"
    >
      {/* ── Cover page (combines cover image + metadata + first page text) ── */}
      <Page size={size} orientation="landscape" style={{ ...styles.coverPage, backgroundColor: bg }}>
        {cover_image && (
          <View style={styles.coverImageContainer}>
            <Image src={cover_image} style={styles.coverImage} />
          </View>
        )}
        <Text style={styles.coverTitle}>{title}</Text>
        {author_name && (
          <Text style={styles.coverAuthor}>
            {getAuthorLabel(author_credit)} {author_name}
          </Text>
        )}
        <View style={styles.coverMeta}>
          {categoryName && (
            <Text style={styles.coverBadge}>{categoryName}</Text>
          )}
          {age_range && (
            <Text style={styles.coverBadge}>Ages {age_range}</Text>
          )}
          <Text style={styles.coverBadge}>{validPages.length} pages</Text>
        </View>
        <Footer />
      </Page>

      {/* ── Story pages ── */}
      {validPages.map((p, i) => {
        const sentenceCount = (p.text.match(/[.!?](\s|$)/g) || []).length;
        const fontSize = sentenceCount >= 4 ? 16 : sentenceCount >= 3 ? 18 : 22;
        const lineHeight = sentenceCount >= 4 ? 1.6 : 1.7;

        return (
          <Page key={i} size={size} orientation="landscape" style={{ ...styles.storyPage, backgroundColor: bg }}>
            {p.image_path && (
              <View style={styles.storyImageContainer}>
                <Image src={p.image_path} style={styles.storyImage} />
              </View>
            )}
            <View style={styles.storyTextContainer}>
              <Text style={{ fontFamily: FONT_SANS, fontSize, color: AMBER_DARK, textAlign: 'center' as const, lineHeight, maxWidth: 600 }}>{p.text}</Text>
            </View>
            <Text style={styles.pageNumber}>{i + 1}</Text>
            <Footer />
          </Page>
        );
      })}

      {/* ── End page ── */}
      <Page size={size} orientation="landscape" style={{ ...styles.endPage, backgroundColor: bg }}>
        <Text style={styles.endTitle}>The End</Text>
        <View style={styles.endDivider} />
        <Text style={styles.endStoryTitle}>{title}</Text>
        {author_name && (
          <Text style={styles.endAuthor}>
            {getAuthorLabel(author_credit)} {author_name}
          </Text>
        )}
        <Text style={styles.endBranding}>
          Made with love on Story Sparks{'\n'}
          storysparks.fun
        </Text>
        <Footer />
      </Page>
    </Document>
  );
}

// ─── Coloring Book PDF ──────────────────────────────────────────────────────
// Each page has the story text + a large empty bordered frame for kids to draw in

interface ColoringPDFProps {
  title: string;
  author_name?: string;
  author_credit?: string;
  pages: PageData[];
  pageSize?: string;
}

const coloringStyles = StyleSheet.create({
  page: {
    backgroundColor: WHITE,
    flexDirection: 'column',
    padding: 40,
    position: 'relative',
  },
  coverTitle: {
    fontFamily: FONT_SERIF_BOLD,
    fontSize: 36,
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  coverSubtitle: {
    fontFamily: FONT_SANS,
    fontSize: 16,
    color: GRAY,
    textAlign: 'center',
    marginBottom: 30,
  },
  coverAuthor: {
    fontFamily: FONT_SANS_BOLD,
    fontSize: 14,
    color: GRAY,
    textAlign: 'center',
    marginBottom: 8,
  },
  drawFrame: {
    flex: 1,
    border: '2px dashed #D1D5DB',
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawHint: {
    fontFamily: FONT_SANS_OBLIQUE,
    fontSize: 14,
    color: '#D1D5DB',
  },
  storyText: {
    fontFamily: FONT_SANS,
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 1.6,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  pageNumber: {
    fontFamily: FONT_SANS,
    fontSize: 10,
    color: '#9CA3AF',
    position: 'absolute',
    bottom: 20,
    right: 40,
  },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: FONT_SANS,
    fontSize: 8,
    color: '#9CA3AF',
    letterSpacing: 1,
  },
});

export function ColoringPDF({
  title,
  author_name,
  author_credit,
  pages,
  pageSize = 'LETTER',
}: ColoringPDFProps) {
  const validPages = pages.filter(p => p.text && p.text.trim().length > 0);
  const size = pageSize as 'LETTER' | 'A4';

  return (
    <Document
      title={`${title} - Coloring Pages`}
      author={author_name || 'Story Sparks'}
      creator="Story Sparks - storysparks.fun"
    >
      {/* Cover */}
      <Page size={size} orientation="landscape" style={coloringStyles.page}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={coloringStyles.coverTitle}>{title}</Text>
          <Text style={coloringStyles.coverSubtitle}>Coloring and Drawing Pages</Text>
          {author_name && (
            <Text style={coloringStyles.coverAuthor}>
              {getAuthorLabel(author_credit)} {author_name}
            </Text>
          )}
          <View style={{ width: 60, height: 2, backgroundColor: '#D1D5DB', marginVertical: 20, borderRadius: 1 }} />
          <Text style={{ fontFamily: FONT_SANS_OBLIQUE, fontSize: 13, color: GRAY, textAlign: 'center' }}>
            Read the story, then draw your own pictures!
          </Text>
        </View>
        <View style={coloringStyles.footer}>
          <Text style={coloringStyles.footerText}>Created with StorySparks.fun</Text>
        </View>
      </Page>

      {/* Story pages with drawing frames */}
      {validPages.map((p, i) => (
        <Page key={i} size={size} orientation="landscape" style={coloringStyles.page}>
          <View style={coloringStyles.drawFrame}>
            <Text style={coloringStyles.drawHint}>Draw your picture here!</Text>
          </View>
          <Text style={coloringStyles.storyText}>{p.text}</Text>
          <Text style={coloringStyles.pageNumber}>{i + 1}</Text>
          <View style={coloringStyles.footer}>
            <Text style={coloringStyles.footerText}>Created with StorySparks.fun</Text>
          </View>
        </Page>
      ))}

      {/* End page */}
      <Page size={size} orientation="landscape" style={coloringStyles.page}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: FONT_SERIF_BOLD, fontSize: 36, color: '#1F2937', marginBottom: 16 }}>The End</Text>
          <Text style={{ fontFamily: FONT_SANS, fontSize: 14, color: GRAY, textAlign: 'center' }}>
            Great job! You made your own illustrated storybook!
          </Text>
        </View>
        <View style={coloringStyles.footer}>
          <Text style={coloringStyles.footerText}>Created with StorySparks.fun</Text>
        </View>
      </Page>
    </Document>
  );
}

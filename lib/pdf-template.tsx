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
    height: '58%',
    overflow: 'hidden',
    backgroundColor: '#F5F0E8',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  storyImage: {
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center',
  },
  storyTextContainer: {
    flex: 1,
    paddingHorizontal: 60,
    paddingTop: 24,
    paddingBottom: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyText: {
    fontFamily: FONT_SANS,
    fontSize: 20,
    color: AMBER_DARK,
    textAlign: 'center',
    lineHeight: 1.7,
    maxWidth: 580,
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
    letterSpacing: 1.5,
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
}

function getAuthorLabel(credit?: string): string {
  if (credit === 'authored') return 'Written by';
  if (credit === 'coauthored') return 'Co-authored by';
  return 'Imagined by';
}

const Footer = () => (
  <View style={styles.footer}>
    <Text style={styles.footerText}>storysparks.fun</Text>
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
}: StoryPDFProps) {
  return (
    <Document
      title={title}
      author={author_name || 'Story Sparks'}
      subject={description || `A Story Sparks storybook`}
      creator="Story Sparks — storysparks.fun"
    >
      {/* ── Cover page ── */}
      <Page size="LETTER" orientation="landscape" style={styles.coverPage}>
        {cover_image && (
          <View style={styles.coverImageContainer}>
            <Image src={cover_image} style={styles.coverImage} />
          </View>
        )}
        <Text style={styles.coverTitle}>{title}</Text>
        {description && (
          <Text style={styles.coverDescription}>{description}</Text>
        )}
        {author_name && (
          <>
            <View style={styles.coverDivider} />
            <Text style={styles.coverAuthor}>
              {getAuthorLabel(author_credit)} {author_name}
            </Text>
          </>
        )}
        <View style={styles.coverMeta}>
          {categoryName && (
            <Text style={styles.coverBadge}>{categoryName}</Text>
          )}
          {age_range && (
            <Text style={styles.coverBadge}>Ages {age_range}</Text>
          )}
          <Text style={styles.coverBadge}>{pages.length} pages</Text>
        </View>
        <Footer />
      </Page>

      {/* ── Story pages ── */}
      {pages.map((p, i) => (
        <Page key={i} size="LETTER" orientation="landscape" style={styles.storyPage}>
          {p.image_path && (
            <View style={styles.storyImageContainer}>
              <Image src={p.image_path} style={styles.storyImage} />
            </View>
          )}
          <View style={styles.storyTextContainer}>
            <Text style={styles.storyText}>{p.text}</Text>
          </View>
          <Text style={styles.pageNumber}>{i + 1}</Text>
          <Footer />
        </Page>
      ))}

      {/* ── End page ── */}
      <Page size="LETTER" orientation="landscape" style={styles.endPage}>
        <Text style={styles.endEmoji}>✨</Text>
        <Text style={styles.endTitle}>The End</Text>
        <Text style={styles.endStoryTitle}>{title}</Text>
        {author_name && (
          <Text style={styles.endAuthor}>
            {getAuthorLabel(author_credit)} {author_name}
          </Text>
        )}
        <View style={styles.endDivider} />
        <Text style={styles.endBranding}>
          Made with love on Story Sparks{'\n'}
          Every kid has a spark — we turn it into a story
        </Text>
        <Footer />
      </Page>
    </Document>
  );
}


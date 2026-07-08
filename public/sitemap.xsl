<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title>XML Sitemap</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <style type="text/css">
          body { font-family: system-ui, -apple-system, sans-serif; font-size: 14px; padding: 2rem; color: #333; }
          h1 { font-size: 24px; font-weight: 600; margin-bottom: 0.5rem; }
          p { color: #666; margin-bottom: 2rem; }
          table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
          th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #eee; }
          th { background-color: #f8f9fa; font-weight: 600; color: #444; }
          tr:hover { background-color: #f8f9fa; }
          a { color: #2563eb; text-decoration: none; }
          a:hover { text-decoration: underline; }
          .url-column { word-break: break-all; }
        </style>
      </head>
      <body>
        <h1>XML Sitemap</h1>
        <p>This is a sitemap intended for search engines like Google.</p>
        <table>
          <tr>
            <th>URL</th>
          </tr>
          <xsl:for-each select="sitemap:urlset/sitemap:url">
            <tr>
              <td class="url-column"><a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a></td>
            </tr>
          </xsl:for-each>
        </table>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>

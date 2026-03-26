import { Request, Response } from 'express';
import { query } from '../config/db.js';

export const getOrganizationDetails = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;

  try {
    const result = await query(`
      SELECT t.name, t.slug, d.*
      FROM tenants t
      LEFT JOIN tenant_details d ON t.id = d.tenant_id
      WHERE t.id = $1
    `, [tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get organization details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateOrganizationDetails = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const { name, slug, website, description, industry, logo_url, banner_url, theme_color } = req.body;

  try {
    // 1. Update tenants table (name and slug)
    if (name || slug) {
      // Fetch current values to check for locks
      const currentTenant = await query('SELECT name, slug FROM tenants WHERE id = $1', [tenantId]);
      const currentName = currentTenant.rows[0]?.name;
      const currentSlug = currentTenant.rows[0]?.slug;

      if (name && currentName && name !== currentName) {
        return res.status(400).json({ message: 'Organization name is locked and cannot be changed.' });
      }

      if (slug && currentSlug && slug !== currentSlug) {
        return res.status(400).json({ message: 'Organization URL slug is locked and cannot be changed.' });
      }

      if (slug && !currentSlug) {
        // Check if slug is taken (only if we're setting it for the first time)
        const existing = await query('SELECT id FROM tenants WHERE slug = $1 AND id != $2', [slug, tenantId]);
        if (existing.rows.length > 0) {
          return res.status(400).json({ message: 'This URL slug is already taken' });
        }
      }

      await query(`
        UPDATE tenants SET 
          name = COALESCE($1, name), 
          slug = COALESCE($2, slug),
          updated_at = NOW() 
        WHERE id = $3
      `, [name, slug, tenantId]);
    }

    // 2. Update or Insert into tenant_details
    const detailExists = await query('SELECT id, logo_url FROM tenant_details WHERE tenant_id = $1', [tenantId]);

    if (detailExists.rows.length > 0) {
      // Check if logo_url is already set and being changed
      const currentLogo = detailExists.rows[0]?.logo_url;
      if (logo_url && currentLogo && logo_url !== currentLogo) {
        return res.status(400).json({ message: 'Organization logo is locked and cannot be changed.' });
      }

      await query(`
        UPDATE tenant_details SET 
          website = COALESCE($1, website),
          description = COALESCE($2, description),
          industry = COALESCE($3, industry),
          logo_url = COALESCE($4, logo_url),
          banner_url = COALESCE($5, banner_url),
          theme_color = COALESCE($6, theme_color),
          updated_at = NOW()
        WHERE tenant_id = $7
      `, [website, description, industry, logo_url, banner_url, theme_color, tenantId]);
    } else {
      await query(`
        INSERT INTO tenant_details (tenant_id, website, description, industry, logo_url, banner_url, theme_color)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [tenantId, website, description, industry, logo_url, banner_url, theme_color]);
    }

    res.json({ message: 'Organization details updated successfully' });
  } catch (error) {
    console.error('Update organization details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

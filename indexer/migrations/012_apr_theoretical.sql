-- Migration: Rename apr_exclude_il to apr_theoretical
-- This aligns the field name with the updated apr.md specification
-- apr_theoretical represents the theoretical return if no grid trades occurred

ALTER TABLE grids RENAME COLUMN apr_exclude_il TO apr_theoretical;

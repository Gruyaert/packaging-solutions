"""Database seeding utility for shapes and cartons data.

This module provides functions to seed the database with initial data from Excel files
or sample data when the actual Excel files are not available.
"""

import { supabase } from '@/integrations/supabase/client';

export interface CartonData {
  reference: string;
  description?: string;
  material?: string;
  length: number;
  width: number;
  height: number;
  cardboard: number;
  active?: boolean;
}

export interface ShapeData {
  shape_id: string;
  variant_id: string;
  description?: string;
  product_group?: string;
  format_a: number;
  format_b: number;
  format_h: number;
  blocked?: boolean;
  active?: boolean;
}

/**
 * Seed the database with sample cartons data.
 * This represents the data that would be in Omdozen.xlsx
 */
export async function seedCartons(userId: string): Promise<number> {
  const cartons: CartonData[] = [
    {
      reference: "DOOS-001",
      description: "Standaard omdoos",
      material: "Karton",
      length: 500,
      width: 300,
      height: 200,
      cardboard: 5,
      active: true
    },
    {
      reference: "DOOS-002",
      description: "Grote doos",
      material: "Karton",
      length: 800,
      width: 600,
      height: 400,
      cardboard: 7,
      active: true
    },
    {
      reference: "DOOS-003",
      description: "Kleine doos",
      material: "Karton",
      length: 300,
      width: 200,
      height: 150,
      cardboard: 3,
      active: true
    },
    {
      reference: "DOOS-004",
      description: "Extra diepe doos",
      material: "Karton",
      length: 500,
      width: 400,
      height: 600,
      cardboard: 8,
      active: true
    },
    {
      reference: "DOOS-005",
      description: "Vierkante doos",
      material: "Karton",
      length: 400,
      width: 400,
      height: 400,
      cardboard: 6,
      active: true
    }
  ];

  try {
    const { data, error } = await supabase
      .from('packaging_cartons')
      .upsert(
        cartons.map(carton => ({
          user_id: userId,
          reference: carton.reference,
          description: carton.description || '',
          material: carton.material || '',
          length: carton.length,
          width: carton.width,
          height: carton.height,
          cardboard: carton.cardboard,
          active: carton.active ?? true
        })),
        { onConflict: 'user_id, reference' }
      );

    if (error) {
      console.error('Error seeding cartons:', error);
      throw error;
    }

    console.log(`Seeded ${data?.length || cartons.length} cartons`);
    return data?.length || cartons.length;
  } catch (error) {
    console.error('Failed to seed cartons:', error);
    throw error;
  }
}

/**
 * Seed the database with sample shapes data.
 * This represents the data that would be in Shapes.xlsx
 */
export async function seedShapes(userId: string): Promise<number> {
  const shapes: ShapeData[] = [
    {
      shape_id: "SHP-001",
      variant_id: "VAR-A",
      description: "Standaard rechthoekige vorm",
      product_group: "Standaard",
      format_a: 500,
      format_b: 300,
      format_h: 200,
      blocked: false,
      active: true
    },
    {
      shape_id: "SHP-001",
      variant_id: "VAR-B",
      description: "Rechthoekige vorm met extra hoogte",
      product_group: "Standaard",
      format_a: 500,
      format_b: 300,
      format_h: 300,
      blocked: false,
      active: true
    },
    {
      shape_id: "SHP-002",
      variant_id: "VAR-A",
      description: "Vierkante vorm",
      product_group: "Premium",
      format_a: 400,
      format_b: 400,
      format_h: 200,
      blocked: false,
      active: true
    },
    {
      shape_id: "SHP-002",
      variant_id: "VAR-B",
      description: "Vierkante vorm met grotere hoogte",
      product_group: "Premium",
      format_a: 400,
      format_b: 400,
      format_h: 250,
      blocked: false,
      active: true
    },
    {
      shape_id: "SHP-003",
      variant_id: "VAR-A",
      description: "Lange rechthoekige vorm",
      product_group: "Speciaal",
      format_a: 800,
      format_b: 200,
      format_h: 150,
      blocked: false,
      active: true
    },
    {
      shape_id: "SHP-003",
      variant_id: "VAR-B",
      description: "Lange rechthoekige vorm met grotere hoogte",
      product_group: "Speciaal",
      format_a: 800,
      format_b: 200,
      format_h: 250,
      blocked: false,
      active: true
    }
  ];

  try {
    const { data, error } = await supabase
      .from('packaging_shapes')
      .upsert(
        shapes.map(shape => ({
          user_id: userId,
          shape_id: shape.shape_id,
          variant_id: shape.variant_id,
          description: shape.description || '',
          product_group: shape.product_group || '',
          format_a: shape.format_a,
          format_b: shape.format_b,
          format_h: shape.format_h,
          blocked: shape.blocked ?? false,
          active: shape.active ?? true
        })),
        { onConflict: 'user_id, shape_id, variant_id' }
      );

    if (error) {
      console.error('Error seeding shapes:', error);
      throw error;
    }

    console.log(`Seeded ${data?.length || shapes.length} shapes`);
    return data?.length || shapes.length;
  } catch (error) {
    console.error('Failed to seed shapes:', error);
    throw error;
  }
}

/**
 * Seed the database with both cartons and shapes data.
 * This is the main entry point for database seeding.
 */
export async function seedDatabase(userId: string): Promise<{ cartons: number; shapes: number }> {
  try {
    const cartonsCount = await seedCartons(userId);
    const shapesCount = await seedShapes(userId);
    
    console.log(`Database seeded successfully: ${cartonsCount} cartons, ${shapesCount} shapes`);
    return { cartons: cartonsCount, shapes: shapesCount };
  } catch (error) {
    console.error('Failed to seed database:', error);
    throw error;
  }
}

/**
 * Check if the database is already seeded and contains data.
 */
export async function isDatabaseSeeded(userId: string): Promise<boolean> {
  try {
    const { data: cartons, error: cartonsError } = await supabase
      .from('packaging_cartons')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (cartonsError) {
      console.error('Error checking cartons:', cartonsError);
      return false;
    }

    const { data: shapes, error: shapesError } = await supabase
      .from('packaging_shapes')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (shapesError) {
      console.error('Error checking shapes:', shapesError);
      return false;
    }

    return (cartons?.length || 0) > 0 && (shapes?.length || 0) > 0;
  } catch (error) {
    console.error('Error checking if database is seeded:', error);
    return false;
  }
}
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/db/mongodb';
import { Emissions } from '@/db/models';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { userId, type, category, value, unit, co2 } = body;

    // Validate required fields
    if (!userId || !type || !category || value === undefined || value === null || !unit || co2 === undefined || co2 === null) {
      return NextResponse.json(
        { error: 'All fields are required: userId, type, category, value, unit, co2', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['individual', 'company', 'city', 'product'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        {
          error: 'Type must be one of: individual, company, city, product',
          code: 'INVALID_TYPE',
        },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = [
      'transportation',
      'electricity',
      'heating',
      'flights',
      'food',
      'manufacturing',
      'energy',
      'waste',
      'product_lca',
      'supply_chain',
      'public_transport',
      'buildings',
      'street_lighting',
      'waste_management',
      'water_treatment',
      // Image-detected categories
      'plastic_waste',
      'paper_waste',
      'metal_waste',
      'glass_waste',
      'electronics',
      'furniture',
      'clothing',
      'general_waste',
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        {
          error: `Category must be one of: ${validCategories.join(', ')}`,
          code: 'INVALID_CATEGORY',
        },
        { status: 400 }
      );
    }

    // Validate numeric values
    if (typeof value !== 'number' || isNaN(value)) {
      return NextResponse.json(
        { error: 'Value must be a valid number', code: 'INVALID_VALUE' },
        { status: 400 }
      );
    }

    if (typeof co2 !== 'number' || isNaN(co2)) {
      return NextResponse.json(
        { error: 'CO2 must be a valid number', code: 'INVALID_CO2' },
        { status: 400 }
      );
    }

    // Create emission entry
    const newEmission = await Emissions.create({
      userId: userId.trim(),
      type: type.trim(),
      category: category.trim(),
      value: Math.round(value),
      unit: unit.trim(),
      co2: Math.round(co2),
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(newEmission, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const searchParams = request.nextUrl.searchParams;
    let userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    userId = userId.trim();

    // Pagination
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '50'),
      100
    );
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get all emissions for user
    const userEmissions = await Emissions.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    return NextResponse.json(userEmissions, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if emission exists and delete
    const deleted = await Emissions.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Emission not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: 'Emission deleted successfully',
        emission: deleted,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}